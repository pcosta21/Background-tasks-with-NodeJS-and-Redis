import Queue from 'bull';

import Sentry from '../config/sentry';
import redisCredentials from '../config/redis';
import * as jobs from '../jobs';

const queues = Object.values(jobs).map(job => ({
    bull: new Queue(job.key, redisCredentials),
    name: job.key,
    handle: job.handle,
    options: job.options,
}));

export default {
    queues,
    add(name, data) {
        const queue = this.queues.find(queue => queue.name == name);
        return queue.bull.add(data, queue.options);
    },
    process() {
        return this.queues.forEach(queue => {
            queue.bull.process(queue.handle);
            queue.bull.on('failed', (job, err) => {
                //console.log('Job failed', queue.key, job.data);
                Sentry.captureMessage(err);
            });
        })
    }
}