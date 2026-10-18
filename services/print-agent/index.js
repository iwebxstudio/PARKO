const express = require('express');
const cors = require('cors');
const ThermalPrinter = require('node-thermal-printer').printer;
const PrinterTypes = require('node-thermal-printer').types;

const app = express();

// ຈຳກັດສິດ CORS ອະນຸຍາດສະເພາະ localhost ແລະ ແອັບພລິເຄຊັນເທິງເຄື່ອງທ້ອງຖິ່ນ (Local Desktop Apps)
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS'));
  },
}));

app.use(express.json());

const PORT = process.env.PORT || 39746;

function validatePrinterInterface(pInterface) {
  if (!pInterface || typeof pInterface !== 'string') {
    return 'printer:Auto';
  }

  const trimmed = pInterface.trim();

  // ຊື່ເຄື່ອງພິມຕາມລະບົບປະຕິບັດການ (OS Printer Name) ເຊັ່ນ printer:Auto ຫຼື printer:MyPrinter
  if (/^printer:[a-zA-Z0-9_\-\s.]+$/i.test(trimmed)) {
    return trimmed;
  }

  // ພອດ Parallel ຫຼື Serial ເທິງ Windows ເຊັ່ນ \\.\LPT1, \\.\COM1
  if (/^\\\\\.\\(LPT|COM)\d+$/i.test(trimmed)) {
    return trimmed;
  }

  // ອຸປະກອນ USB ຫຼື Serial ເທິງ Linux ເຊັ່ນ /dev/usb/lp0, /dev/ttyUSB0
  if (/^\/dev\/(usb\/lp\d+|tty(USB|S|ACM)\d+)$/i.test(trimmed)) {
    return trimmed;
  }

  // ເຄື່ອງພິມຜ່ານລະບົບເຄືອຂ່າຍ TCP: ອະນຸຍາດສະເພາະ IP ແບບ Private IPv4 ພາຍໃນເຄືອຂ່າຍທ້ອງຖິ່ນ ແລະ ພອດມາດຕະຖານເທົ່ານັ້ນ
  const tcpMatch = trimmed.match(/^tcp:\/\/([a-zA-Z0-9\.\-]+)(?::(\d+))?$/i);
  if (tcpMatch) {
    const host = tcpMatch[1];
    const port = tcpMatch[2] ? parseInt(tcpMatch[2], 10) : 9100;

    if (port < 1 || port > 65535) {
      throw new Error('Invalid printer TCP port');
    }

    const isPrivateIp = (
      host === '127.0.0.1' ||
      host === 'localhost' ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(host)
    );

    if (!isPrivateIp) {
      throw new Error('SSRF protection: TCP printer address must be a local/private subnet IP');
    }

    return `tcp://${host}:${port}`;
  }

  throw new Error('Invalid or disallowed printer interface format');
}

app.post('/print', async (req, res) => {
  const { ticket, printerConfig } = req.body;
  
  if (!ticket) {
    return res.status(400).json({ error: 'Missing ticket data' });
  }

  let pInterface;
  try {
    pInterface = validatePrinterInterface(printerConfig?.interface);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  // ກຳນົດຄ່າເລີ່ມຕົ້ນຂອງເຄື່ອງພິມຕາມປະເພດ USB ຫຼື Serial/Network
  const pType = printerConfig?.type === 'usb' ? PrinterTypes.EPSON : PrinterTypes.STAR;
  const pWidth = printerConfig?.paperWidth === 80 ? 48 : 42; // ຈຳນວນຕົວອັກສອນຕໍ່ແຖວຕາມຂະໜາດເຈ້ຍ (80mm ຫຼື 58mm)

  try {
    let printer = new ThermalPrinter({
      type: pType,
      interface: pInterface,
      characterSet: 'PC858_EURO',
      removeSpecialCharacters: false,
      lineCharacter: '=',
      options: {
        timeout: 5000
      }
    });

    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      console.warn('Printer not connected! Simulating print...');
      // ໃນສະພາບແວດລ້ອມການພັດທະນາ ຈະຈຳລອງການພິມ (Simulate) ເພື່ອປ້ອງກັນບໍ່ໃຫ້ເກີດ Error ເມື່ອບໍ່ໄດ້ເຊື່ອມຕໍ່ເຄື່ອງພິມຕົວຈິງ
    }

    printer.alignCenter();
    printer.println('PARKO PARKING SYSTEM');
    printer.drawLine();
    
    printer.alignLeft();
    printer.println(`Ticket: ${ticket.ticketNumber}`);
    printer.println(`Type:   ${ticket.vehicleType?.label || 'Vehicle'}`);
    printer.println(`Plate:  ${ticket.plateNumber || 'N/A'}`);
    printer.println(`In:     ${new Date(ticket.checkInAt).toLocaleString()}`);
    
    if (ticket.checkOutAt) {
      printer.println(`Out:    ${new Date(ticket.checkOutAt).toLocaleString()}`);
      printer.println(`Time:   ${ticket.duration?.formatted || ''}`);
      printer.drawLine();
      printer.alignRight();
      printer.println(`TOTAL: ${new Intl.NumberFormat('lo-LA').format(ticket.totalAmount || ticket.calculatedCost || 0)} LAK`);
      if (ticket.paymentStatus) {
        printer.println(`Status: ${ticket.paymentStatus}`);
      }
    } else {
      printer.drawLine();
      printer.alignCenter();
      printer.printQR(ticket.ticketNumber);
    }
    
    printer.drawLine();
    printer.alignCenter();
    printer.println('Thank you for using our service');
    printer.cut();

    if (isConnected) {
      await printer.execute();
      console.log(`Printed receipt for ticket: ${ticket.ticketNumber}`);
    } else {
      console.log(`Simulated print for ticket: ${ticket.ticketNumber}`);
    }

    res.status(200).json({ success: true, message: 'Print job executed' });
  } catch (error) {
    console.error('Print Error:', error);
    res.status(500).json({ error: 'Failed to print receipt', details: error.message });
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🖨️  PARKO Local Print Agent running on http://localhost:${PORT}`);
  console.log(`Ready to receive print jobs via POST /print`);
});
