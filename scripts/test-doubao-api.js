#!/usr/bin/env node

// 测试豆包视觉API连接
const https = require('https');

const API_KEY = '08091838-56bc-40f3-a947-a84de8cd78b9';
const MODEL = 'doubao-seed-1-6-250615';
const BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

// 测试图片URL（豆包官方示例）
const TEST_IMAGE_URL = 'https://ark-project.tos-cn-beijing.ivolces.com/images/view.jpeg';

const testRequest = {
  model: MODEL,
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: '请仔细分析这张图片，识别出其中的所有食材。请按照以下JSON格式返回结果：\n\n{\n  "ingredients": ["食材1", "食材2", "食材3"],\n  "confidence": 0.95,\n  "description": "图片描述",\n  "suggestions": ["建议的额外食材"],\n  "categories": ["蔬菜", "肉类", "调料"]\n}\n\n要求：\n1. ingredients数组包含所有能识别出的具体食材名称\n2. confidence表示识别的整体置信度(0-1)\n3. description简要描述图片内容\n4. suggestions可选，推荐可能需要的额外食材\n5. categories将食材按类型分类\n6. 只返回JSON格式，不要其他文字'
        },
        {
          type: 'image_url',
          image_url: {
            url: TEST_IMAGE_URL
          }
        }
      ]
    }
  ],
  max_tokens: 1000,
  temperature: 0.1
};

function makeRequest() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(testRequest);
    
    const options = {
      hostname: 'ark.cn-beijing.volces.com',
      port: 443,
      path: '/api/v3/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ status: res.statusCode, data: response });
        } catch (error) {
          resolve({ status: res.statusCode, data: data, error: 'JSON解析失败' });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function testDoubaoAPI() {
  console.log('🧪 测试豆包视觉API连接...\n');
  
  console.log('📋 测试配置:');
  console.log(`   API Key: ${API_KEY.substring(0, 8)}...${API_KEY.substring(API_KEY.length - 8)}`);
  console.log(`   Model: ${MODEL}`);
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Test Image: ${TEST_IMAGE_URL}\n`);

  try {
    console.log('🚀 发送请求...');
    const startTime = Date.now();
    
    const result = await makeRequest();
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️  响应时间: ${duration}ms`);
    console.log(`📊 状态码: ${result.status}\n`);

    if (result.status === 200) {
      console.log('✅ API调用成功!\n');
      
      if (result.data.choices && result.data.choices.length > 0) {
        const content = result.data.choices[0].message.content;
        console.log('📝 AI响应内容:');
        console.log(content);
        console.log('\n');
        
        // 尝试解析JSON
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            console.log('🎯 解析后的识别结果:');
            console.log(`   食材数量: ${parsed.ingredients?.length || 0}`);
            console.log(`   置信度: ${(parsed.confidence * 100).toFixed(1)}%`);
            console.log(`   描述: ${parsed.description}`);
            console.log(`   食材列表: ${parsed.ingredients?.join(', ')}`);
            if (parsed.categories) {
              console.log(`   分类: ${parsed.categories.join(', ')}`);
            }
          }
        } catch (parseError) {
          console.log('⚠️  JSON解析失败，但API调用成功');
        }
        
        if (result.data.usage) {
          console.log('\n📊 Token使用情况:');
          console.log(`   输入Token: ${result.data.usage.prompt_tokens}`);
          console.log(`   输出Token: ${result.data.usage.completion_tokens}`);
          console.log(`   总计Token: ${result.data.usage.total_tokens}`);
        }
      } else {
        console.log('⚠️  API响应格式异常，没有找到choices');
        console.log('原始响应:', JSON.stringify(result.data, null, 2));
      }
    } else {
      console.log('❌ API调用失败!');
      console.log('错误响应:', result.data);
    }

  } catch (error) {
    console.log('💥 请求异常:');
    console.log(error.message);
  }
}

// 运行测试
testDoubaoAPI().then(() => {
  console.log('\n🏁 测试完成');
}).catch((error) => {
  console.log('\n💥 测试失败:', error.message);
});
