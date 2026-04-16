import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const triageLatency = new Trend('triage_latency', true);
const bookingLatency = new Trend('booking_latency', true);

// Default options - override with CLI: k6 run --vus 50 --duration 5m load-test.js
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // ramp-up
    { duration: '2m',  target: 50 },  // sustained load
    { duration: '30s', target: 100 }, // spike
    { duration: '1m',  target: 50 },  // recover
    { duration: '30s', target: 0 },   // ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1500'],
    errors: ['rate<0.05'],            // <5% error rate
    triage_latency: ['p(95)<2000'],   // triage within 2s
    booking_latency: ['p(95)<300'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5001';
const AGENT_URL = __ENV.AGENT_URL || 'http://localhost:5002';
const SCHEDULING_URL = __ENV.SCHEDULING_URL || 'http://localhost:5006';

const symptoms = [
  'Patient reports severe chest pain and difficulty breathing',
  'Patient has moderate pain in the lower back for three days',
  'Patient requests prescription refill for multivitamins',
  'Patient reports high fever and persistent headache',
  'Patient has a small cut on the finger',
  'Patient is experiencing shortness of breath after exercise',
];

function randomSymptom() {
  return symptoms[Math.floor(Math.random() * symptoms.length)];
}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export default function () {
  group('Health checks', () => {
    const res = http.get(`${BASE_URL}/health`);
    check(res, { 'health OK': (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
  });

  group('Voice session lifecycle', () => {
    const createRes = http.post(
      `${BASE_URL}/api/v1/voice/sessions`,
      JSON.stringify({ patientId: uuidv4() }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    check(createRes, { 'session created': (r) => r.status === 201 });
    errorRate.add(createRes.status !== 201);

    if (createRes.status === 201) {
      const session = JSON.parse(createRes.body);
      const transcriptRes = http.post(
        `${BASE_URL}/api/v1/voice/sessions/${session.id}/transcript`,
        JSON.stringify({ transcriptText: randomSymptom() }),
        { headers: { 'Content-Type': 'application/json' } }
      );
      check(transcriptRes, { 'transcript OK': (r) => r.status === 200 });

      http.post(`${BASE_URL}/api/v1/voice/sessions/${session.id}/end`);
    }
  });

  group('Triage workflow', () => {
    const start = Date.now();
    const triageRes = http.post(
      `${AGENT_URL}/api/v1/agents/triage`,
      JSON.stringify({ sessionId: uuidv4(), transcriptText: randomSymptom() }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    triageLatency.add(Date.now() - start);
    check(triageRes, { 'triage created': (r) => r.status === 201 });
    errorRate.add(triageRes.status !== 201);
  });

  group('Scheduling flow', () => {
    const start = Date.now();
    const slotsRes = http.get(`${SCHEDULING_URL}/api/v1/scheduling/slots`);
    bookingLatency.add(Date.now() - start);
    check(slotsRes, { 'slots OK': (r) => r.status === 200 });
    errorRate.add(slotsRes.status !== 200);
  });

  sleep(1);
}
