#!/usr/bin/env node

// 测试图片识别功能
const http = require('http');

// 使用豆包官方测试图片URL
const TEST_IMAGE_URL = 'https://ark-project.tos-cn-beijing.ivolces.com/images/view.jpeg';

const testRequest = {
  imageDataUrl: TEST_IMAGE_URL,
  apiKeys: {
    doubao: {
      key: '08091838-56bc-40f3-a947-a84de8cd78b9',
      endpointId: 'doubao-seed-1-6-250615'
    }
  },
  options: {
    maxRetries: 2,
    timeout: 30000
  }
};

function makeRequest() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(testRequest);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/recognize-ingredients',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
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

async function testImageRecognition() {
  console.log('🧪 测试Recipe-Genius图片识别功能...\n');
  
  console.log('📋 测试配置:');
  console.log('   API端点: http://localhost:3001/api/recognize-ingredients');
  console.log('   图片格式: 图片URL');
  console.log('   测试图片: 豆包官方示例图片');
  console.log('   API提供商: 豆包视觉API\n');

  try {
    console.log('🚀 发送识别请求...');
    const startTime = Date.now();
    
    const result = await makeRequest();
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️  响应时间: ${duration}ms`);
    console.log(`📊 状态码: ${result.status}\n`);

    if (result.status === 200 && result.data.success) {
      console.log('✅ 图片识别成功!\n');
      
      const data = result.data.data;
      console.log('🎯 识别结果:');
      console.log(`   食材数量: ${data.ingredients?.length || 0}`);
      console.log(`   置信度: ${(data.confidence * 100).toFixed(1)}%`);
      console.log(`   描述: ${data.description}`);
      console.log(`   处理时间: ${data.processingTime}ms`);
      
      if (data.ingredients && data.ingredients.length > 0) {
        console.log(`   识别的食材: ${data.ingredients.join(', ')}`);
      }
      
      if (data.suggestions && data.suggestions.length > 0) {
        console.log(`   建议食材: ${data.suggestions.join(', ')}`);
      }
      
      if (data.categories && data.categories.length > 0) {
        console.log(`   食材分类: ${data.categories.join(', ')}`);
      }
      
    } else {
      console.log('❌ 图片识别失败!');
      console.log('错误信息:', result.data.error || result.data.message || '未知错误');
      
      if (result.data.error && result.data.error.includes('API密钥')) {
        console.log('\n💡 解决建议:');
        console.log('   1. 检查.env.local文件中的DOUBAO_API_KEY配置');
        console.log('   2. 确保API密钥有效且有足够的配额');
        console.log('   3. 检查网络连接是否正常');
      }
    }

  } catch (error) {
    console.log('💥 请求异常:');
    console.log(error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 解决建议:');
      console.log('   请确保开发服务器正在运行: npm run dev:webpack');
    }
  }
}

// 运行测试
testImageRecognition().then(() => {
  console.log('\n🏁 测试完成');
}).catch((error) => {
  console.log('\n💥 测试失败:', error.message);
});
