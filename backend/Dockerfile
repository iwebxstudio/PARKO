# ─────────────────────────────────────────────────────────────────────────────
# PARKO Backend — ໄຟລ໌ Multi-stage Dockerfile ສຳລັບສະພາບແວດລ້ອມ Production
# ມາດຕະຖານ: ຄວາມປອດໄພລະດັບ Enterprise, ໃຊ້ຜູ້ໃຊ້ Non-Root, ແລະ Alpine Linux ຂະໜາດກະທັດຮັດ
# ─────────────────────────────────────────────────────────────────────────────

# ຂັ້ນຕອນທີ 1 (Stage 1): ຈັດການ ແລະ ຕິດຕັ້ງ Dependencies ທັງໝົດ
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
# ຕິດຕັ້ງ Dependencies ສະເພາະສຳລັບ Production ເທົ່ານັ້ນ ແລ້ວສຳເນົາເກັບໄວ້ຕ່າງຫາກ
RUN npm ci --omit=dev && cp -R node_modules /prod_modules
# ຕິດຕັ້ງ Dependencies ທັງໝົດລວມທັງ devDependencies ເພື່ອໃຊ້ສຳລັບການ Compile ແລະ Build ໂຄ້ດ
RUN npm ci

# ຂັ້ນຕອນທີ 2 (Stage 2): ທຳການ Compile TypeScript ແລະ Build ແອັບພລິເຄຊັນ
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build
RUN npx tsc prisma/seed.ts --outDir dist/prisma --skipLibCheck --module commonjs --target es2021 --moduleResolution node

# ຂັ້ນຕອນທີ 3 (Stage 3): ສະພາບແວດລ້ອມສຳລັບ Run ລະບົບ Production ຕົວຈິງ
FROM node:20-alpine AS production
WORKDIR /app

# ຕິດຕັ້ງ openssl ສຳລັບ Prisma ORM ແລະ dumb-init ເພື່ອຈັດການ Signal PID 1 ໃຫ້ຖືກຕ້ອງ
RUN apk add --no-cache openssl dumb-init

# ສຳເນົາ Dependencies ແລະ ໄຟລ໌ Artifacts ທີ່ Build ແລ້ວເຂົ້າມາ
COPY --from=deps /prod_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/prisma ./prisma
COPY package*.json ./
COPY docker-entrypoint.sh ./

# ສ້າງໂຟນເດີ uploads, logs ແລະ ກຳນົດສິດຄວາມປອດໄພໃຫ້ແກ່ user 'node' (Non-root user)
RUN chmod +x docker-entrypoint.sh && \
    mkdir -p uploads logs && \
    chown -R node:node /app

USER node
ENV NODE_ENV=production
EXPOSE 3000

ENTRYPOINT ["/usr/bin/dumb-init", "--", "./docker-entrypoint.sh"]
CMD ["node", "dist/src/main.js"]
