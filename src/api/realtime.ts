import { io } from 'socket.io-client';
import { loadSession } from '../auth/session';
import { API_URL } from '../config';

/**
 * Abre una conexión Socket.IO con el backend (misma URL que la API) para recibir avisos en tiempo real.
 * Llama a `onSessionCreated` cada vez que llega `session:created`, que es cuando se guarda un
 * entrenamiento del usuario (en la web, en la app o en otro dispositivo).
 * Devuelve una función que cierra la conexión.
 */
export function connectRealtime(onSessionCreated: () => void): () => void {
  const socket = io(API_URL, {
    transports: ['websocket'],
    // Una conexión nueva cada vez: sin esto la librería reutiliza la anterior de la misma URL
    forceNew: true,
    // El token se pide en cada (re)conexión, así se usa siempre el último si se ha renovado
    auth: (callback) => callback({ token: loadSession()?.token }),
  });

  socket.on('session:created', onSessionCreated);

  // Si no se puede conectar (servidor caído, token que no vale...) no hacemos nada:
  // la pantalla sigue funcionando con su botón de actualizar
  socket.on('connect_error', () => {});

  return () => {
    socket.close();
  };
}
