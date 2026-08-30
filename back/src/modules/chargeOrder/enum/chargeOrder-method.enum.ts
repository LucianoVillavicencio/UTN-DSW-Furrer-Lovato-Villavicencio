// The two front-desk collection paths a charge order can be armed for.
// 'point' targets a card terminal; 'qr' targets a shared printed code (a
// "caja"). collectionPointId on the order holds the terminal id or the
// external_pos_id, respectively — the caller decides which applies.
export enum ChargeOrderMethod {
  POINT = 'point',
  QR = 'qr',
}
