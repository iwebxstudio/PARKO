// ==============================================================================
// PARKO — ບໍລິການແຈ້ງເຕືອນລະບົບ (Notifications Service)
// ຮອງຮັບການສົ່ງການແຈ້ງເຕືອນຜ່ານຊ່ອງທາງ Email, Telegram Bot ແລະ Discord Webhook
// ==============================================================================
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * ສົ່ງຂໍ້ຄວາມແຈ້ງເຕືອນໄປຍັງທຸກຊ່ອງທາງທີ່ມີສະຖານະເປີດໃຊ້ງານ (Active Channels)
   */
  async send(title: string, message: string) {
    const configs = await this.prisma.notificationConfig.findMany({
      where: { isActive: true },
    });

    for (const config of configs) {
      try {
        switch (config.channel) {
          case 'EMAIL':
            await this.sendEmail(config.config as any, title, message);
            break;
          case 'TELEGRAM':
            await this.sendTelegram(config.config as any, title, message);
            break;
          case 'DISCORD':
            await this.sendDiscord(config.config as any, title, message);
            break;
        }
      } catch (err) {
        this.logger.error(
          `Notification failed [${config.channel}]: ${err.message}`,
        );
      }
    }
  }

  private async sendEmail(config: any, title: string, message: string) {
    // ໂຫຼດ nodemailer ແບບ Dynamic Import ເພື່ອປະຢັດ Resource ເມື່ອບໍ່ໄດ້ໃຊ້ Email
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port || 587,
      auth: { user: config.user, pass: config.pass },
    });

    await transporter.sendMail({
      from: config.from || config.user,
      to: config.to,
      subject: `[PARKO] ${title}`,
      text: message,
      html: `<h3>${title}</h3><p>${message}</p>`,
    });

    this.logger.log(`Email sent: ${title}`);
  }

  private async sendTelegram(config: any, title: string, message: string) {
    const { botToken, chatId } = config;
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `🅿️ *PARKO*\n*${title}*\n${message}`,
        parse_mode: 'Markdown',
      }),
    });

    this.logger.log(`Telegram sent: ${title}`);
  }

  private async sendDiscord(config: any, title: string, message: string) {
    const { webhookUrl } = config;

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [
          {
            title: `🅿️ PARKO — ${title}`,
            description: message,
            color: 0x3b82f6,
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });

    this.logger.log(`Discord sent: ${title}`);
  }

  /**
   * ດຶງຂໍ້ມູນການຕັ້ງຄ່າຊ່ອງທາງການແຈ້ງເຕືອນທັງໝົດ
   */
  async getConfigs() {
    return this.prisma.notificationConfig.findMany();
  }

  /**
   * ອັບເດດຂໍ້ມູນການຕັ້ງຄ່າ ແລະ ສະຖານະເປີດ/ປິດ ຂອງຊ່ອງທາງການແຈ້ງເຕືອນ
   */
  async updateConfig(id: string, data: { config?: any; isActive?: boolean }) {
    return this.prisma.notificationConfig.update({
      where: { id },
      data,
    });
  }

  /**
   * ສ້າງການຕັ້ງຄ່າຊ່ອງທາງການແຈ້ງເຕືອນໃໝ່
   */
  async createConfig(channel: any, config: any) {
    return this.prisma.notificationConfig.create({
      data: { channel, config, isActive: false },
    });
  }
}
