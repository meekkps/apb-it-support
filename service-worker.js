/* APB IT Support 2026 - Self-destruct Service Worker
   ໂຕນີ້ unregister ຕົວເອງ + ລົບ cache ທັງໝົດ ເພື່ອໃຫ້ browser ກັບໄປໃຊ້
   network ປົກກະຕິ — user ຈະໄດ້ສະບັບໃໝ່ສະເໝີ. */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // ລົບ cache ທັງໝົດ
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      // Unregister ຕົວເອງ
      await self.registration.unregister();
      // ສັ່ງ tab ທັງໝົດ reload → ໄດ້ HTML ໃໝ່ຈາກ network
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((c) => c.navigate(c.url));
    })()
  );
});

// ບໍ່ມີ fetch handler → browser ດຶງຈາກ network ປົກກະຕິ
