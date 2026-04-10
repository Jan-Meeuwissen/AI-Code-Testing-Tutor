const express = require('express');
const fetch   = require('node-fetch');
const fs      = require('fs');
const path    = require('path');

const app   = express();
const PORT  = process.env.PORT || 3000;
const HOST  = process.env.OLLAMA_HOST || 'http://ollama:11434';
const MODEL = process.env.MODEL || 'qwen2.5-coder:1.5b-instruct';
const ROLE_CONFIG_PATH = process.env.ROLE_CONFIG_PATH || './config/role.json';

app.use(express.json());
app.use(express.static('public'));

// ── Build system prompt from role.json ──────────────────────────
function buildSystemPrompt(config) {
  const lines = [];
  const add = (str) => lines.push(str);
  const section = (title) => { add(''); add(title + ':'); };
  const list = (items) => items.forEach(i => add('- ' + i));

  if (config.role)        add('ROLE: ' + config.role + (config.version ? ' v' + config.version : ''));
  if (config.description) add(config.description);
  if (config.primaryTask) { section('PRIMARY TASK'); add(config.primaryTask); }

  if (config.expertise && config.expertise.length) {
    section('EXPERTISE');
    list(config.expertise);
  }

  if (config.responsibilities && config.responsibilities.length) {
    section('RESPONSIBILITIES');
    list(config.responsibilities);
  }

  if (config.coachingApproach) {
    const ca = config.coachingApproach;
    if (ca.philosophy && ca.philosophy.length) {
      section('COACHING PHILOSOPHY');
      list(ca.philosophy);
    }
    if (ca.techniques && ca.techniques.length) {
      section('COACHING TECHNIQUES');
      list(ca.techniques);
    }
    if (ca.progressionSupport && ca.progressionSupport.length) {
      section('PROGRESSION SUPPORT');
      list(ca.progressionSupport);
    }
  }

  if (config.behavior) {
    const b = config.behavior;
    if (b.mindset && b.mindset.length) {
      section('MINDSET');
      list(b.mindset);
    }
    if (b.communication && b.communication.length) {
      section('COMMUNICATION');
      list(b.communication);
    }
    if (b.outputFormat && b.outputFormat.length) {
      section('OUTPUT FORMAT');
      list(b.outputFormat);
    }
  }

  if (config.constraints && config.constraints.length) {
    section('CONSTRAINTS');
    list(config.constraints);
  }

  return lines.join('\n');
}

// ── Load role config ─────────────────────────────────────────────
let systemPrompt = 'You are a helpful assistant.';

try {
  const raw    = fs.readFileSync(path.resolve(ROLE_CONFIG_PATH), 'utf8');
  const config = JSON.parse(raw);
  systemPrompt = buildSystemPrompt(config);
  console.log('✅ Role config loaded from:', ROLE_CONFIG_PATH);
} catch (err) {
  console.warn('⚠️  Could not load role config, using default. Reason:', err.message);
}

// ── Chat endpoint ────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Invalid messages format' });
  }

  // ── Prompt Injection voor kleine modellen ──────────────────────
  // We halen de laatste user prompt op en plakken de system instructies erbovenop.
  const lastIndex = messages.length - 1;
  const originalContent = messages[lastIndex].content;
  
  messages[lastIndex].content = `### SYSTEM INSTRUCTIONS ###\n${systemPrompt}\n\n### USER QUERY ###\n${originalContent}`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const ollamaRes = await fetch(`${HOST}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:    MODEL,
        messages: messages, // Geen aparte system role meer nodig
        stream:   true
      })
    });

    if (!ollamaRes.ok) {
      res.write(`data: ${JSON.stringify({ error: 'Ollama error: ' + ollamaRes.status })}\n\n`);
      return res.end();
    }

    const reader = ollamaRes.body;
    let   buffer = '';

    reader.on('data', chunk => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          const token  = parsed.message?.content || '';
          if (token) {
            res.write(`data: ${JSON.stringify({ token })}\n\n`);
          }
          if (parsed.done) {
            res.write('data: [DONE]\n\n');
            res.end();
          }
        } catch {}
      }
    });

    reader.on('end', () => {
      if (!res.writableEnded) {
        res.write('data: [DONE]\n\n');
        res.end();
      }
    });

    reader.on('error', err => {
      console.error('Stream error:', err);
      res.end();
    });

  } catch (err) {
    console.error('Fetch error:', err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

app.get('/health', (_req, res) => res.json({ status: 'ok', model: MODEL }));

app.get('/api/config-hash', (_req, res) => {
  const crypto = require('crypto');
  const hash = crypto.createHash('md5').update(systemPrompt).digest('hex').slice(0, 8);
  res.json({ hash });
});

app.listen(PORT, () => {
  console.log(`🚀 AI Code Testing Tutor running on port ${PORT}`);
});