import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { DOWNLOADS_MAP } from "./downloads-map"

function getS3Client() {
  const region = process.env.AWS_REGION
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error("Configuração AWS incompleta no .env")
  }

  return new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
}

export async function gerarLinkDownloadS3(
  produtoRef: string,
  expiresInSeconds = 60 * 60 * 6
) {
  const bucket = process.env.AWS_S3_BUCKET
  const key = DOWNLOADS_MAP[produtoRef]

  if (!bucket) {
    throw new Error("AWS_S3_BUCKET não configurado no .env")
  }

  if (!key) {
    throw new Error(`Produto sem arquivo mapeado: ${produtoRef}`)
  }

  const s3 = getS3Client()

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  })

  const url = await getSignedUrl(s3, command, {
    expiresIn: expiresInSeconds,
  })

  return {
    url,
    key,
    expiresInSeconds,
  }
}
