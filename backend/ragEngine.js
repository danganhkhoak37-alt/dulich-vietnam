/**
 * RAG Engine for WanderlyVietNam AI Chatbox (Groq Cloud API Version)
 * 
 * Pipeline: Load JSON Data → Chunk → Vector Store (In-Memory) → Keyword Search → Generate (Groq)
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env file manually if exists
try {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split(/\r?\n/).forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        if (key && !process.env[key]) {
          process.env[key] = value.replace(/^['"]|['"]$/g, '');
        }
      }
    });
  }
} catch (e) {
  console.error('Không thể đọc file .env:', e.message);
}

// ============================================================
// CONFIG
// ============================================================
const GROQ_API_URL = 'https://api.groq.com/openai/v1';
const PREFERRED_MODELS = [
  'groq/compound-mini',
  'qwen/qwen3.6-27b',
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant'
];
const TOP_K = 5; // Number of relevant chunks to retrieve

const SYSTEM_PROMPT = `Bạn là WanderlyAI - trợ lý AI thông minh và thân thiện của nền tảng du lịch Wanderly VietNam.
Nhiệm vụ của bạn là tư vấn du lịch dựa trên thông tin cẩm nang du lịch Việt Nam được cung cấp, đồng thời hướng dẫn người dùng sử dụng các tính năng của trang web nếu họ hỏi.

Về trang web Wanderly VietNam, đây là một nền tảng du lịch toàn diện với các tính năng:
- Khám phá 3D: Người dùng có thể xem Không gian 3D (Street View) thực tế tại 120+ địa điểm bằng cách bấm "Khám phá 3D" trong chi tiết địa điểm.
- Cộng đồng chia sẻ: Đăng ký/đăng nhập tài khoản để đăng bài chia sẻ kinh nghiệm, tải ảnh lên, thả tim, lưu bài viết và bình luận cùng các phượt thủ khác.
- Cẩm nang & Đề xuất: Cung cấp bài viết hướng dẫn du lịch chi tiết (chuẩn bị hành trang, thời tiết, lịch trình), xem đề xuất địa điểm theo mùa hoặc danh mục (Biển đảo, Chữa lành, Văn hoá lịch sử, Phượt...).
- Tin tức sự kiện: Cập nhật tin tức, sự kiện lễ hội du lịch mới nhất.
- Trợ lý AI: Là chính bạn (WanderlyAI), hỗ trợ lên lịch trình, giải đáp thắc mắc du lịch 24/7.

Quy tắc:
1. LUÔN trả lời bằng tiếng Việt
2. Dựa vào thông tin được cung cấp trong CONTEXT bên dưới để trả lời chính xác
3. Nếu khách hỏi về cách sử dụng trang web hoặc "Tôi có thể làm gì ở đây?", hãy nhiệt tình giới thiệu các tính năng trên và hướng dẫn họ trải nghiệm.
4. Nếu không có thông tin trong context, hãy nói rõ "Mình chưa có thông tin chi tiết về điều này trong cẩm nang, nhưng mình có thể gợi ý..."
5. Trả lời ngắn gọn, dễ hiểu, thân thiện như một người bạn đồng hành
6. Gợi ý thêm các địa danh hoặc mẹo liên quan nếu phù hợp
7. Sử dụng emoji phù hợp để tạo cảm giác thân thiện 🌟
8. Khi đề cập đến địa danh, luôn kèm theo tỉnh/thành phố
9. Nếu user hỏi chung chung, hãy hỏi lại để tư vấn chính xác hơn`;

// Helper: Strip <think>...</think> tags if model produces reasoning output
function stripThinkingTags(text) {
  if (!text) return '';
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

// ============================================================
// VECTOR STORE (In-Memory)
// ============================================================
class VectorStore {
  constructor() {
    this.documents = []; // { id, text, metadata, embedding }
  }

  add(id, text, metadata, embedding) {
    this.documents.push({ id, text, metadata, embedding });
  }

  cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) return 0;
    let dotProduct = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  search(queryEmbedding, topK = TOP_K) {
    const scored = this.documents.map(doc => ({
      ...doc,
      score: this.cosineSimilarity(queryEmbedding, doc.embedding)
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  get size() {
    return this.documents.length;
  }
}

// ============================================================
// RAG ENGINE
// ============================================================
class RAGEngine {
  constructor() {
    this.vectorStore = new VectorStore();
    this.isReady = false;
    this.isBuilding = false;
    this.groqOnline = false;
    this.activeModel = process.env.CHAT_MODEL || null;
    this.availableModels = [];
  }

  get ollamaOnline() {
    return this.groqOnline;
  }
  set ollamaOnline(val) {
    this.groqOnline = val;
  }

  // ----------------------------------------------------------
  // Check if Groq API is reachable and key is valid
  // ----------------------------------------------------------
  async checkGroq() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      this.groqOnline = false;
      return { online: false, models: [], error: 'Thiếu GROQ_API_KEY trong file .env hoặc biến môi trường.' };
    }
    try {
      const res = await fetch(`${GROQ_API_URL}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        this.groqOnline = true;
        this.availableModels = data.data || [];

        // Auto-select best working model if not explicitly set in process.env
        const availableIds = new Set(this.availableModels.map(m => m.id));
        if (process.env.CHAT_MODEL && availableIds.has(process.env.CHAT_MODEL)) {
          this.activeModel = process.env.CHAT_MODEL;
        } else {
          this.activeModel = PREFERRED_MODELS.find(m => availableIds.has(m)) || this.availableModels[0]?.id || 'groq/compound-mini';
        }

        console.log(`🤖 Groq Model đã chọn: ${this.activeModel}`);
        return { online: true, models: this.availableModels, activeModel: this.activeModel };
      }
      this.groqOnline = false;
      const errText = await res.text();
      return { online: false, models: [], error: `Groq API báo lỗi ${res.status}: ${errText}` };
    } catch (err) {
      this.groqOnline = false;
      return { online: false, models: [], error: err.message };
    }
  }

  async checkOllama() {
    return this.checkGroq();
  }

  async getEmbedding(text) {
    return null;
  }

  // Helper to get candidate models to try
  getModelCandidates() {
    const list = [];
    if (this.activeModel) list.push(this.activeModel);
    if (process.env.CHAT_MODEL && !list.includes(process.env.CHAT_MODEL)) {
      list.push(process.env.CHAT_MODEL);
    }
    for (const m of PREFERRED_MODELS) {
      if (!list.includes(m)) list.push(m);
    }
    return list;
  }

  // ----------------------------------------------------------
  // Generate chat response from Groq API (with auto-fallback)
  // ----------------------------------------------------------
  async generate(prompt, history = []) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('Chưa cấu hình GROQ_API_KEY trong biến môi trường hoặc file .env.');
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-6).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: prompt }
    ];

    const modelsToTry = this.getModelCandidates();
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        const res = await fetch(`${GROQ_API_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.7,
            max_tokens: 1024,
            top_p: 0.9
          })
        });

        if (!res.ok) {
          const errText = await res.text();
          console.warn(`⚠️ Groq model [${model}] failed (${res.status}): ${errText}`);
          lastError = new Error(`Groq error ${res.status}: ${errText}`);
          continue; // Try next model
        }

        const data = await res.json();
        const rawContent = data.choices?.[0]?.message?.content || '';
        const cleaned = stripThinkingTags(rawContent);
        this.activeModel = model; // Remember the successful model
        return cleaned || 'Xin chào! Mình là WanderlyAI, mình có thể giúp gì cho chuyến du lịch của bạn?';
      } catch (err) {
        lastError = err;
        console.warn(`⚠️ Groq generate error with model [${model}]:`, err.message);
      }
    }

    throw lastError || new Error('Không thể kết nối đến bất kỳ mô hình AI nào trên Groq.');
  }

  // ----------------------------------------------------------
  // Stream chat response from Groq API (with auto-fallback)
  // ----------------------------------------------------------
  async *generateStream(prompt, history = []) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('Chưa cấu hình GROQ_API_KEY trong biến môi trường hoặc file .env.');
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-6).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: prompt }
    ];

    const modelsToTry = this.getModelCandidates();
    let streamSuccess = false;
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        const res = await fetch(`${GROQ_API_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages,
            stream: true,
            temperature: 0.7,
            max_tokens: 1024,
            top_p: 0.9
          })
        });

        if (!res.ok) {
          const errText = await res.text();
          console.warn(`⚠️ Groq stream model [${model}] failed (${res.status}): ${errText}`);
          lastError = new Error(`Groq stream error: ${res.status} - ${errText}`);
          continue; // Try next model
        }

        const reader = res.body;
        const decoder = new TextDecoder();
        let buffer = '';
        let insideThink = false;

        for await (const chunk of reader) {
          buffer += decoder.decode(chunk, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine) continue;
            if (cleanLine === 'data: [DONE]') {
              streamSuccess = true;
              return;
            }

            if (cleanLine.startsWith('data: ')) {
              try {
                const jsonStr = cleanLine.slice(6);
                const json = JSON.parse(jsonStr);
                const content = json.choices?.[0]?.delta?.content;
                if (content) {
                  // Filter reasoning/thinking tokens
                  if (content.includes('<think>')) {
                    insideThink = true;
                  }
                  if (insideThink) {
                    if (content.includes('</think>')) {
                      insideThink = false;
                      const afterThink = content.split('</think>')[1];
                      if (afterThink) yield afterThink;
                    }
                    continue;
                  }
                  yield content;
                }
              } catch (e) {
                // Ignore incomplete json chunks
              }
            }
          }
        }

        streamSuccess = true;
        this.activeModel = model;
        return;
      } catch (err) {
        lastError = err;
        console.warn(`⚠️ Groq generateStream error with model [${model}]:`, err.message);
      }
    }

    if (!streamSuccess) {
      throw lastError || new Error('Không thể tạo luồng phản hồi từ Groq API.');
    }
  }

  // ----------------------------------------------------------
  // Chunk data from JSON files
  // ----------------------------------------------------------
  loadAndChunkData() {
    const chunks = [];
    const dataDir = path.join(__dirname, '..', 'src', 'data');

    // 1. superGuideContent.json
    try {
      const superGuide = JSON.parse(fs.readFileSync(path.join(dataDir, 'superGuideContent.json'), 'utf-8'));
      superGuide.forEach((loc, idx) => {
        const itineraryText = (loc.itinerary || [])
          .map(iti => `${iti.duration}: ${iti.content}`)
          .join('\n');

        chunks.push({
          id: `super-guide-${idx}`,
          text: `Địa danh: ${loc.name} (${loc.province})
Hành trang cần chuẩn bị: ${loc.hangTrang || 'Đang cập nhật'}
Mẹo tiết kiệm: ${loc.tietKiem || 'Đang cập nhật'}
Lưu ý an toàn: ${loc.anToan || 'Đang cập nhật'}
Lịch trình gợi ý:
${itineraryText || 'Đang cập nhật'}`,
          metadata: {
            source: 'superGuideContent',
            name: loc.name,
            province: loc.province,
            type: 'detailed_guide'
          }
        });
      });
      console.log(`  ✅ Loaded ${superGuide.length} items from superGuideContent.json`);
    } catch (err) {
      console.error('  ❌ Error loading superGuideContent.json:', err.message);
    }

    // 2. guideContent.json
    try {
      const guideContent = JSON.parse(fs.readFileSync(path.join(dataDir, 'guideContent.json'), 'utf-8'));
      guideContent.forEach((region, rIdx) => {
        (region.provinces || []).forEach((prov, pIdx) => {
          const locationNames = (prov.locations || []).map(l => l.name).join(', ');
          chunks.push({
            id: `guide-province-${rIdx}-${pIdx}`,
            text: `Vùng ${region.region} - Tỉnh/TP ${prov.name}: ${prov.description || ''}
Các địa danh nổi bật: ${locationNames}`,
            metadata: {
              source: 'guideContent',
              name: prov.name,
              province: prov.name,
              region: region.region,
              type: 'province_overview'
            }
          });

          (prov.locations || []).forEach((loc, lIdx) => {
            chunks.push({
              id: `guide-loc-${rIdx}-${pIdx}-${lIdx}`,
              text: `Địa danh: ${loc.name} (Tỉnh ${prov.name}, Vùng ${region.region})
Mô tả: ${loc.description || 'Đang cập nhật'}`,
              metadata: {
                source: 'guideContent',
                name: loc.name,
                province: prov.name,
                region: region.region,
                type: 'location_description'
              }
            });
          });
        });
      });
      console.log(`  ✅ Loaded guideContent.json (${chunks.length} total chunks so far)`);
    } catch (err) {
      console.error('  ❌ Error loading guideContent.json:', err.message);
    }

    // 3. locationDetails.json
    try {
      const locDetails = JSON.parse(fs.readFileSync(path.join(dataDir, 'locationDetails.json'), 'utf-8'));
      if (Array.isArray(locDetails)) {
        locDetails.forEach((loc, idx) => {
          let detailText = `Địa danh: ${loc.name || 'N/A'}`;
          if (loc.location) detailText += ` (${loc.location})`;
          if (loc.description) detailText += `\nMô tả: ${loc.description}`;
          if (loc.tag) detailText += `\nLoại hình: ${loc.tag}`;
          if (loc.best_month_start && loc.best_month_end) {
            detailText += `\nThời điểm đẹp nhất: Tháng ${loc.best_month_start} đến Tháng ${loc.best_month_end}`;
          }

          chunks.push({
            id: `loc-detail-${idx}`,
            text: detailText,
            metadata: {
              source: 'locationDetails',
              name: loc.name || 'Unknown',
              province: loc.location || '',
              type: 'location_detail'
            }
          });
        });
      }
      console.log(`  ✅ Loaded locationDetails.json (${chunks.length} total chunks)`);
    } catch (err) {
      console.error('  ❌ Error loading locationDetails.json:', err.message);
    }

    return chunks;
  }

  // ----------------------------------------------------------
  // Build the vector index (Keyword search index)
  // ----------------------------------------------------------
  async buildIndex() {
    if (this.isBuilding) {
      console.log('⏳ Index is already being built...');
      return;
    }

    this.isBuilding = true;
    console.log('\n🔨 Building RAG Index (Keyword Mode)...');

    try {
      // Validate Groq config
      const status = await this.checkGroq();
      if (!status.online) {
        console.log('⚠️ Groq API check: Offline. Lý do:', status.error);
        console.log('   Chú ý: RAG vẫn sẽ hoạt động qua Keyword Search, nhưng gọi LLM sinh câu trả lời sẽ cần GROQ_API_KEY hợp lệ.');
      } else {
        console.log(`✅ Groq API hoạt động bình thường! Model: ${this.activeModel}`);
      }

      // Load data
      const chunks = this.loadAndChunkData();
      chunks.forEach(chunk => {
        this.vectorStore.add(chunk.id, chunk.text, chunk.metadata, null);
      });

      this.isReady = true;
      console.log(`✅ RAG Index sẵn sàng với ${this.vectorStore.size} tài liệu (Chế độ Keyword Search).`);
    } catch (err) {
      console.error('❌ Lỗi khi dựng RAG Index:', err.message);
    } finally {
      this.isBuilding = false;
    }
  }

  // ----------------------------------------------------------
  // Search for relevant documents
  // ----------------------------------------------------------
  async search(query, topK = TOP_K) {
    if (this.vectorStore.size === 0) return [];
    return this.keywordSearch(query, topK);
  }

  // ----------------------------------------------------------
  // Keyword-based search
  // ----------------------------------------------------------
  keywordSearch(query, topK = TOP_K) {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 1);

    const scored = this.vectorStore.documents.map(doc => {
      const textLower = doc.text.toLowerCase();
      const metaLower = JSON.stringify(doc.metadata).toLowerCase();

      let score = 0;
      for (const word of queryWords) {
        if (textLower.includes(word)) score += 2;
        if (metaLower.includes(word)) score += 3;
        // Thêm điểm nếu khớp chính xác tên địa danh hoặc tỉnh
        if (doc.metadata.name && doc.metadata.name.toLowerCase().includes(word)) score += 5;
        if (doc.metadata.province && doc.metadata.province.toLowerCase().includes(word)) score += 4;
      }

      return { ...doc, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.filter(d => d.score > 0).slice(0, topK);
  }

  // ----------------------------------------------------------
  // Full RAG Chat: Search → Augment → Generate
  // ----------------------------------------------------------
  async chat(message, history = []) {
    const results = await this.search(message);

    const contextParts = results.map((r, i) =>
      `[Nguồn ${i + 1}: ${r.metadata.name} - ${r.metadata.province}]\n${r.text}`
    );
    const context = contextParts.join('\n\n---\n\n');

    const augmentedPrompt = context
      ? `CONTEXT (Thông tin từ cẩm nang du lịch):\n${context}\n\n---\n\nCâu hỏi của khách: ${message}`
      : `Câu hỏi của khách: ${message}\n\n(Lưu ý: Không tìm thấy thông tin cụ thể trong cẩm nang cho câu hỏi này)`;

    const reply = await this.generate(augmentedPrompt, history);

    const sources = results.map(r => ({
      name: r.metadata.name,
      province: r.metadata.province,
      type: r.metadata.type,
      score: Math.round(r.score * 100) / 100
    }));

    return { reply, sources };
  }

  // ----------------------------------------------------------
  // RAG Chat with Streaming
  // ----------------------------------------------------------
  async *chatStream(message, history = []) {
    const results = await this.search(message);

    const contextParts = results.map((r, i) =>
      `[Nguồn ${i + 1}: ${r.metadata.name} - ${r.metadata.province}]\n${r.text}`
    );
    const context = contextParts.join('\n\n---\n\n');

    const augmentedPrompt = context
      ? `CONTEXT (Thông tin từ cẩm nang du lịch):\n${context}\n\n---\n\nCâu hỏi của khách: ${message}`
      : `Câu hỏi của khách: ${message}`;

    const sources = results.map(r => ({
      name: r.metadata.name,
      province: r.metadata.province,
      type: r.metadata.type,
      score: Math.round(r.score * 100) / 100
    }));
    yield JSON.stringify({ type: 'sources', data: sources }) + '\n';

    for await (const token of this.generateStream(augmentedPrompt, history)) {
      yield JSON.stringify({ type: 'token', data: token }) + '\n';
    }

    yield JSON.stringify({ type: 'done' }) + '\n';
  }

  // ----------------------------------------------------------
  // Ask about a specific location (for Guide page)
  // ----------------------------------------------------------
  async askAboutLocation(locationName, question) {
    const searchQuery = `${locationName} ${question}`;
    const results = await this.search(searchQuery, 4);

    const locationResults = results.filter(r =>
      r.metadata.name.toLowerCase().includes(locationName.toLowerCase()) ||
      locationName.toLowerCase().includes(r.metadata.name.toLowerCase())
    );

    const finalResults = locationResults.length > 0 ? locationResults : results;

    const contextParts = finalResults.map((r, i) =>
      `[${r.metadata.name} - ${r.metadata.province}]\n${r.text}`
    );
    const context = contextParts.join('\n\n---\n\n');

    const prompt = `CONTEXT về ${locationName}:\n${context}\n\n---\n\nCâu hỏi về ${locationName}: ${question}`;

    const reply = await this.generate(prompt);
    const sources = finalResults.map(r => ({
      name: r.metadata.name,
      province: r.metadata.province
    }));

    return { reply, sources };
  }
}

// Export singleton
const ragEngine = new RAGEngine();
module.exports = ragEngine;
