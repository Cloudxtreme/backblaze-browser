const Rx = require('rxjs');
const B2 = require('backblaze-b2');

var b2 = new B2({
    accountId: process.env.ACCOUNTID,
    applicationKey: process.env.APPLICATIONKEY
});

let buckets = b2.authorize()
    .then(() => b2.listBuckets())
    .then((response) => Rx.Observable.from(response.buckets))
;

var count = 0;

Rx.Observable.fromPromise(buckets)
    .mergeAll()
    .flatMap(bucket => listFileRecursive(b2, bucket.bucketId))
    .subscribe(f => {
        count++;
    }, e => console.error(e), () => console.log('Total: ' + count))
;

function listFileRecursive(b2, bucketId, next) {
    return Rx.Observable.create(obs => {
        var promise;
        if (next !== undefined) {
            promise = b2.listFileNames({maxFileCount: 1000, bucketId: bucketId, startFileName: next})
        } else {
            promise = b2.listFileNames({maxFileCount: 1000, bucketId: bucketId})
        }
        promise.then(response => {
            response.files.forEach(f => obs.next(f));
            if (response.nextFileName !== null && response.files.length > 0) {
                listFileRecursive(b2, bucketId, response.nextFileName).subscribe(
                    f => obs.next(f),
                    e => obs.error(e),
                    () => obs.complete()
                );
            } else {
                obs.complete();
            }
        }).catch((e) => {
            console.error(e);
            obs.error(e);
        });
    });
}