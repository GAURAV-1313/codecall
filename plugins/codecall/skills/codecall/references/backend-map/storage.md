# Files and object storage

## object-storage

- **Name:** Object storage instead of local disk
- **Requires:** `stateless-services`
- **Signals:** `PutObjectCommand`, `boto3.client("s3")`, `@google-cloud/storage`, `S3_BUCKET`, `ActiveStorage::Blob`, `multer.diskStorage`
- **Idea:** Files go to a shared bucket addressed by key instead of the server's own disk, so any instance can read them and nothing is lost when a container is replaced.
- **Misconceptions:**
  - Writing uploads to `./uploads` is fine until you scale; it breaks the moment a second instance or a redeploy wipes the container filesystem.
  - A bucket is a filesystem; keys only look like paths, renames are copies, and there is no atomic move or append.
- **Checks:**
  - If your service runs on three instances behind a load balancer, which instance can serve a file your handler just saved, and why?
  - What does your code store in the database for each file, and what happens if the object upload succeeds but that row insert fails?
- **Go deeper:**
  - [Sriniously · Backend from first principles #23 · 9:54](https://www.youtube.com/watch?v=Ie0TjKI9cDI&t=594s)
  - [AWS docs: What is Amazon S3?](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html)

## presigned-urls

- **Name:** Pre-signed URLs
- **Requires:** `object-storage`
- **Signals:** `getSignedUrl`, `generate_presigned_url`, `PresignPutObject`, `X-Amz-Signature`, `createPresignedPost`
- **Idea:** The server signs a short-lived URL for one object and one method, so clients upload or download directly from storage without file bytes passing through your API or holding bucket credentials.
- **Misconceptions:**
  - A pre-signed URL is private once issued; it is a bearer token, so anyone holding it can use it until it expires.
  - Signing an upload URL means the upload is validated; size, content type and contents still need limits in the policy or a check afterwards.
- **Checks:**
  - How long do the URLs your code signs stay valid, and what could someone do with one copied from a log or browser history?
  - After a client uploads through your pre-signed URL, how does your code learn the upload finished and verify it is the expected file?
- **Go deeper:**
  - [Sriniously · Backend from first principles #23 · 1:16:42](https://www.youtube.com/watch?v=Ie0TjKI9cDI&t=4602s)
  - [AWS docs: Download and upload objects with presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html)

## streaming-uploads

- **Name:** Streaming instead of buffering uploads
- **Requires:** none
- **Signals:** `stream.pipeline`, `req.pipe(`, `busboy`, `multer.memoryStorage`, `io.Copy(`, `UploadFile.read()`
- **Idea:** Streaming moves request bytes through the server in small chunks to their destination, so memory stays flat regardless of file size instead of holding the whole body in RAM.
- **Misconceptions:**
  - Memory storage is fine for uploads; a few concurrent large files load entirely into RAM and the process gets killed for running out of memory.
  - Streaming means no limits are needed; you still cap total bytes, because an endless stream ties up a connection and fills the destination.
- **Checks:**
  - If ten users upload a 2 GB file to your handler at once, roughly how much memory does your process need, and why?
  - When the client disconnects halfway through, what does your code do with the partial data it already wrote to the destination?
- **Go deeper:**
  - [Sriniously · Backend from first principles #23 · 1:11:43](https://www.youtube.com/watch?v=Ie0TjKI9cDI&t=4303s)
  - [Node.js docs: Stream](https://nodejs.org/api/stream.html)

## multipart-upload

- **Name:** Multipart uploads
- **Requires:** `object-storage`
- **Signals:** `CreateMultipartUpload`, `UploadPart`, `CompleteMultipartUpload`, `AbortIncompleteMultipartUpload`, `@aws-sdk/lib-storage`
- **Idea:** A large object is uploaded as independently sent numbered parts and then assembled, so failed parts retry alone, parts go in parallel, and huge files fit within per-request limits.
- **Misconceptions:**
  - Multipart upload is the same as `multipart/form-data`; one is an HTML form encoding, the other is a storage API for chunked objects.
  - Abandoned uploads clean themselves up; incomplete parts stay stored and billed until aborted, so you need an abort lifecycle rule.
- **Checks:**
  - If part 37 of 80 fails in your code, what gets retried, and where do you keep the part numbers and ETags needed to complete?
  - What in your setup removes multipart uploads that a client started but never completed or aborted?
- **Go deeper:**
  - [Sriniously · Backend from first principles #24 · 4:30](https://www.youtube.com/watch?v=iWrVCxexUWY&t=270s)
  - [AWS docs: Uploading and copying objects using multipart upload](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html)

## range-requests

- **Name:** HTTP range requests
- **Requires:** `http-messages`
- **Signals:** `Range: bytes=`, `Accept-Ranges: bytes`, `206 Partial Content`, `Content-Range`, `416 Range Not Satisfiable`, `If-Range`
- **Idea:** A client asks for a byte slice of a resource with a Range header and the server returns 206 with just that slice, enabling resumable downloads and video seeking.
- **Misconceptions:**
  - Range support is automatic; a handler that streams a file and always returns 200 forces players and download managers to restart from byte zero.
  - Ranges only matter for video; resumable downloads, parallel chunked fetches and reading file footers like ZIP or Parquet all depend on them.
- **Checks:**
  - When a client sends `Range: bytes=1000-` to your download endpoint, does your code return 206 with the right Content-Range, or the whole file?
  - If the file changes between two range requests to your handler, how could the client end up with a corrupted mix, and what header prevents that?
- **Go deeper:**
  - [Sriniously · Backend from first principles #24 · 32:51](https://www.youtube.com/watch?v=iWrVCxexUWY&t=1971s)
  - [MDN: HTTP range requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Range_requests)
