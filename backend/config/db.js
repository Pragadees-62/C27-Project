const { DynamoDBClient }          = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient }  = require('@aws-sdk/lib-dynamodb');

const region = process.env.AWS_REGION || 'ap-south-1';

// If running locally with LocalStack or DynamoDB Local, set DYNAMO_ENDPOINT
const clientConfig = { region };
if (process.env.DYNAMO_ENDPOINT) {
  clientConfig.endpoint = process.env.DYNAMO_ENDPOINT;
  clientConfig.credentials = {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID     || 'local',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local',
  };
}

const raw = new DynamoDBClient(clientConfig);
const db  = DynamoDBDocumentClient.from(raw, {
  marshallOptions:   { removeUndefinedValues: true },
  unmarshallOptions: { wrapNumbers: false },
});

// Table name helpers — prefix from env (default: sms)
const P = process.env.TABLE_PREFIX || 'sms';
const TABLES = {
  USERS:         `${P}-users`,
  TEACHERS:      `${P}-teachers`,
  STUDENTS:      `${P}-students`,
  JOIN_REQUESTS: `${P}-join-requests`,
  MARKS:         `${P}-marks`,
  ATTENDANCE:    `${P}-attendance`,
  ANNOUNCEMENTS: `${P}-announcements`,
  FEES:          `${P}-fees`,
};

console.log(`✅  DynamoDB connected → region: ${region}`);

module.exports = { db, TABLES };
