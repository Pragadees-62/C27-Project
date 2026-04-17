/**
 * DynamoDB helper layer — replaces Mongoose models.
 * Each function maps to a DynamoDB operation using the DocumentClient.
 */
const { v4: uuidv4 }  = require('uuid');
const {
  PutCommand, GetCommand, DeleteCommand,
  ScanCommand, QueryCommand, UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');
const { db, TABLES } = require('../config/db');

// ── Generic helpers ───────────────────────────────────────────────────────────

/** Scan entire table (use sparingly — no pagination for simplicity) */
const scanAll = async (TableName, FilterExpression, ExpressionAttributeValues, ExpressionAttributeNames) => {
  const params = { TableName };
  if (FilterExpression)        params.FilterExpression        = FilterExpression;
  if (ExpressionAttributeValues) params.ExpressionAttributeValues = ExpressionAttributeValues;
  if (ExpressionAttributeNames)  params.ExpressionAttributeNames  = ExpressionAttributeNames;
  const result = await db.send(new ScanCommand(params));
  return result.Items || [];
};

/** Get item by primary key (hash key = 'id') */
const getById = async (TableName, id) => {
  const result = await db.send(new GetCommand({ TableName, Key: { id } }));
  return result.Item || null;
};

/** Put (create/replace) item */
const putItem = async (TableName, item) => {
  await db.send(new PutCommand({ TableName, Item: item }));
  return item;
};

/** Delete item by id */
const deleteById = async (TableName, id) => {
  await db.send(new DeleteCommand({ TableName, Key: { id } }));
};

/** Query a GSI */
const queryGSI = async (TableName, IndexName, keyName, keyValue) => {
  const result = await db.send(new QueryCommand({
    TableName,
    IndexName,
    KeyConditionExpression: '#k = :v',
    ExpressionAttributeNames:  { '#k': keyName },
    ExpressionAttributeValues: { ':v': keyValue },
  }));
  return result.Items || [];
};

// ── Users ─────────────────────────────────────────────────────────────────────
const User = {
  findByEmail: (email) => getById(TABLES.USERS, email.toLowerCase()),
  create: (data) => putItem(TABLES.USERS, { ...data, email: data.email.toLowerCase() }),
  update: (email, updates) => putItem(TABLES.USERS, { ...updates, email: email.toLowerCase() }),
  deleteByEmail: (email) => db.send(new DeleteCommand({ TableName: TABLES.USERS, Key: { email: email.toLowerCase() } })),
};

// ── Teachers ──────────────────────────────────────────────────────────────────
const Teacher = {
  findAll:       ()     => scanAll(TABLES.TEACHERS),
  findById:      (id)   => getById(TABLES.TEACHERS, id),
  findByEmail:   (email) => queryGSI(TABLES.TEACHERS, 'email-index', 'email', email.toLowerCase()).then(r => r[0] || null),
  findByDept:    (dept)  => queryGSI(TABLES.TEACHERS, 'department-index', 'department', dept),
  create: (data) => {
    const item = { id: uuidv4(), ...data, email: data.email.toLowerCase() };
    return putItem(TABLES.TEACHERS, item);
  },
  update: (id, data) => putItem(TABLES.TEACHERS, { id, ...data }),
  deleteById: (id) => deleteById(TABLES.TEACHERS, id),
};

// ── Students ──────────────────────────────────────────────────────────────────
const Student = {
  findAll:     ()      => scanAll(TABLES.STUDENTS),
  findById:    (id)    => getById(TABLES.STUDENTS, id),
  findByEmail: (email) => queryGSI(TABLES.STUDENTS, 'email-index', 'email', email.toLowerCase()).then(r => r[0] || null),
  create: (data) => {
    const item = { id: uuidv4(), ...data, email: data.email.toLowerCase() };
    return putItem(TABLES.STUDENTS, item);
  },
  update: (id, data) => putItem(TABLES.STUDENTS, { id, ...data }),
  deleteById:    (id)    => deleteById(TABLES.STUDENTS, id),
  deleteByEmail: (email) => Student.findByEmail(email).then(s => s ? deleteById(TABLES.STUDENTS, s.id) : null),
};

// ── Join Requests ─────────────────────────────────────────────────────────────
const JoinRequest = {
  findAll:        ()     => scanAll(TABLES.JOIN_REQUESTS),
  findById:       (id)   => getById(TABLES.JOIN_REQUESTS, id),
  findByEmail:    (email) => queryGSI(TABLES.JOIN_REQUESTS, 'studentEmail-index', 'studentEmail', email.toLowerCase()),
  findByDept:     (dept)  => scanAll(
    TABLES.JOIN_REQUESTS,
    '#d = :d',
    { ':d': dept },
    { '#d': 'department' }
  ),
  create: (data) => {
    const item = { id: uuidv4(), ...data, studentEmail: data.studentEmail.toLowerCase(), requestedAt: new Date().toISOString() };
    return putItem(TABLES.JOIN_REQUESTS, item);
  },
  update: (id, updates) => getById(TABLES.JOIN_REQUESTS, id).then(existing => putItem(TABLES.JOIN_REQUESTS, { ...existing, ...updates })),
  deleteByEmail: async (email) => {
    const items = await JoinRequest.findByEmail(email);
    await Promise.all(items.map(i => deleteById(TABLES.JOIN_REQUESTS, i.id)));
  },
};

// ── Generic CRUD factory for Marks, Attendance, Announcements, Fees ───────────
const makeTable = (tableName) => ({
  findAll:    ()   => scanAll(tableName),
  findById:   (id) => getById(tableName, id),
  create: (data) => {
    const item = { id: uuidv4(), ...data };
    return putItem(tableName, item);
  },
  update: async (id, data) => {
    const existing = await getById(tableName, id);
    if (!existing) return null;
    return putItem(tableName, { ...existing, ...data, id });
  },
  deleteById: (id) => deleteById(tableName, id),
});

const Marks        = makeTable(TABLES.MARKS);
const Attendance   = makeTable(TABLES.ATTENDANCE);
const Announcement = makeTable(TABLES.ANNOUNCEMENTS);
const Fees         = makeTable(TABLES.FEES);

module.exports = { User, Teacher, Student, JoinRequest, Marks, Attendance, Announcement, Fees };
