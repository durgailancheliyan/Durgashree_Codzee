import crypto from 'crypto';
import Razorpay from 'razorpay';
let client = null;
export function getRazorpayKeyId() {
    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    if (!keyId) {
        throw new Error('RAZORPAY_KEY_ID is not configured');
    }
    return keyId;
}
export function getRazorpayClient() {
    if (!client) {
        const keyId = getRazorpayKeyId();
        const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
        if (!keySecret) {
            throw new Error('RAZORPAY_KEY_SECRET is not configured');
        }
        client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    }
    return client;
}
export function verifyPaymentSignature(orderId, paymentId, signature) {
    const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
    if (!secret)
        return false;
    const body = `${orderId}|${paymentId}`;
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    return expected === signature;
}
