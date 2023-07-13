import type { FastifyInstance } from 'fastify';
import sleep from 'sleep-promise';

type EmailsQueuePayload =
	| {
			message: 'order-created';
			data: {
				orderId: string;
				email: string;
				amount: number;
				type: string;
				status: 'created';
			};
	  }
	| {
			message: 'payment-completed';
			data: {
				paymentId: string;
			};
	  };

export default async function events(app: FastifyInstance) {
	await app.queue.channel.consume(app.config.EMAILS_QUEUE_NAME, async msg => {
		if (msg) {
			const { message, data } = JSON.parse(
				msg.content.toString(),
			) as EmailsQueuePayload;

			switch (message) {
				case 'order-created': {
					const { orderId } = data;

					// We simulate a network delay
					await sleep(3000);

					app.queue.channel.sendToQueue(
						app.config.ORDERS_QUEUE_NAME,
						Buffer.from(
							JSON.stringify({
								message: 'orders-email-sent',
								data: {
									orderId,
								},
							}),
							'utf-8',
						),
					);

					app.log.info('Order email sent.');

					break;
				}
				case 'payment-completed': {
					const { paymentId } = data;

					// We simulate a network delay
					await sleep(3000);

					const payload = Buffer.from(
						JSON.stringify({
							message: 'payments-email-sent',
							data: {
								paymentId,
							},
						}),
						'utf-8',
					);

					app.queue.channel.sendToQueue(
						app.config.PAYMENTS_QUEUE_NAME,
						payload,
					);

					app.queue.channel.sendToQueue(app.config.ORDERS_QUEUE_NAME, payload);

					app.log.info('Payment email sent.');

					break;
				}
			}

			app.queue.channel.ack(msg);
		}
	});
}
