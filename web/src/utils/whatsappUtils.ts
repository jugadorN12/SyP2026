export const generateWhatsAppLink = (phone: string, message: string) => {
  const encodedMessage = encodeURIComponent(message);
  // Remove any non-numeric characters from phone
  const cleanPhone = phone.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};

export const formatOrderMessage = (bolicheName: string, items: { nombre: string, cantidad: number }[]) => {
  let message = `*Pedido de Reposición - ${bolicheName}*\n\n`;
  message += `Hola, necesito el siguiente pedido:\n`;

  items.forEach(item => {
    message += `• ${item.nombre} x${item.cantidad}\n`;
  });

  message += `\n_Generado automáticamente por SyP POS_`;
  return message;
};
