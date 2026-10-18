FROM nginx:alpine

# ຕິດຕັ້ງ openssl ເພື່ອໃຊ້ສ້າງໃບຢັ້ງຢືນຄວາມປອດໄພ SSL ແບບ Self-signed ອັດຕະໂນມັດ
RUN apk add --no-cache openssl

# ສຳເນົາສະຄຣິບ entrypoint ເຂົ້າໄປໃນ Container ແລະ ກຳນົດສິດການ Run ພ້ອມແປງ CRLF ເປັນ LF
COPY entrypoint.sh /entrypoint.sh
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh

# ກຳນົດ Entrypoint ແລະ ຄຳສັ່ງເລີ່ມຕົ້ນການເຮັດວຽກຂອງ Nginx Daemon ແບບ Foreground
ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
