function buildCoachContext(snapshot, publicData) {
  const recommendation = snapshot.recommendation ?? {};
  const gameState = snapshot.gameState ?? {};
  const suggestions = recommendation.suggestions ?? [];

  return {
    hero: recommendation.heroName ?? gameState.hero?.displayName ?? "unknown",
    phase: recommendation.phase ?? "unknown",
    gameTime: gameState.gameTime ?? 0,
    level: gameState.level ?? 1,
    gold: gameState.gold ?? 0,
    items: gameState.items ?? [],
    threats: snapshot.context?.threats ?? [],
    suggestions: suggestions.map((item) => ({
      item: item.itemName,
      priority: item.priority,
      reason: item.reason
    })),
    publicData: {
      hasCache: Boolean(publicData?.hasCache),
      generatedAt: publicData?.generatedAt ?? null,
      heroCount: publicData?.heroCount ?? 0,
      itemCount: publicData?.itemCount ?? 0
    }
  };
}

function fallbackCoach(snapshot, publicData) {
  const context = buildCoachContext(snapshot, publicData);
  const firstSuggestion = context.suggestions[0];

  if (!firstSuggestion) {
    return {
      mode: "local",
      text: "还没有收到 Dota 2 GSI 数据。先进入比赛，或者点击演示状态按钮测试推荐流程。"
    };
  }

  const dataNote = context.publicData.hasCache
    ? `公开数据缓存已同步，包含 ${context.publicData.heroCount} 个英雄和 ${context.publicData.itemCount} 个物品条目。`
    : "尚未同步公开数据；当前解释只基于内置规则和实时 GSI 状态。";

  return {
    mode: "local",
    text: [
      `当前最优先考虑 ${firstSuggestion.item}。`,
      firstSuggestion.reason,
      `你现在处于 ${context.phase} 阶段，等级 ${context.level}，可用金钱 ${context.gold}。`,
      "这个建议只用于学习和判断，不会也不能替你在游戏里执行任何操作。",
      dataNote
    ].join("\n")
  };
}

function safeSystemPrompt(language) {
  const languageHint = language === "en" ? "English" : "Chinese";
  return [
    `You are a Dota 2 learning coach. Respond in ${languageHint}.`,
    "Use only the JSON context provided by the app.",
    "The app only uses Dota 2 Game State Integration, manual user tags, and public OpenDota constants.",
    "Do not claim access to hidden enemy information, fog-of-war information, memory, packets, or internal game state.",
    "Never suggest automation, scripting, macros, memory reading, injection, hooks, packet capture, or bypassing anti-cheat.",
    "Give concise, beginner-friendly item reasoning with alternatives and uncertainty."
  ].join(" ");
}

async function callOllama(config, context) {
  const endpoint = config.endpoint || "http://127.0.0.1:11434/api/chat";
  const model = config.model || "llama3.1";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: "system", content: safeSystemPrompt(config.language) },
        { role: "user", content: JSON.stringify(context) }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`AI request failed: ${response.status}`);
  }

  const payload = await response.json();
  return payload.message?.content ?? payload.response ?? "";
}

async function callOpenAiCompatible(config, context) {
  const endpoint = config.endpoint || "https://api.openai.com/v1/chat/completions";
  const model = config.model || "gpt-4o-mini";
  const headers = { "Content-Type": "application/json" };
  if (config.apiKey) {
    headers.Authorization = `Bearer ${config.apiKey}`;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: safeSystemPrompt(config.language) },
        { role: "user", content: JSON.stringify(context) }
      ],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    throw new Error(`AI request failed: ${response.status}`);
  }

  const payload = await response.json();
  return payload.choices?.[0]?.message?.content ?? "";
}

async function aiCoach(config, snapshot, publicData) {
  const context = buildCoachContext(snapshot, publicData);

  if (!config?.enabled) {
    return fallbackCoach(snapshot, publicData);
  }

  const provider = config.provider || "ollama";
  const text = provider === "openai-compatible"
    ? await callOpenAiCompatible(config, context)
    : await callOllama(config, context);

  return {
    mode: provider,
    text: text || fallbackCoach(snapshot, publicData).text
  };
}

module.exports = {
  aiCoach,
  fallbackCoach
};
