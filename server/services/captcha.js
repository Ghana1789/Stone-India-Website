import crypto from 'crypto';

export const generateCaptcha = () => {
  const num1 = Math.floor(Math.random() * 9) + 1; // 1-9
  const num2 = Math.floor(Math.random() * 9) + 1; // 1-9
  const operators = ['+', '-', '*'];
  const operator = operators[Math.floor(Math.random() * operators.length)];
  
  let challenge = '';
  let answer = 0;
  
  switch (operator) {
    case '+':
      challenge = `What is ${num1} + ${num2}?`;
      answer = num1 + num2;
      break;
    case '-':
      challenge = `What is ${num1} - ${num2}?`;
      answer = num1 - num2;
      break;
    case '*':
      challenge = `What is ${num1} * ${num2}?`;
      answer = num1 * num2;
      break;
  }
  
  const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes validity
  const secret = process.env.JWT_SECRET || 'stone_india_super_secret_jwt_key_2024_ev_battery';
  
  // Sign the answer and expiry
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${answer}:${expiry}`)
    .digest('hex');
    
  const captchaToken = Buffer.from(`${expiry}:${signature}`).toString('base64');
  
  return { challenge, captchaToken };
};

export const verifyCaptcha = (userAnswer, captchaToken) => {
  try {
    if (!userAnswer || !captchaToken) return false;
    
    const decoded = Buffer.from(captchaToken, 'base64').toString('utf8');
    const [expiryStr, signature] = decoded.split(':');
    const expiry = parseInt(expiryStr, 10);
    
    if (Date.now() > expiry) return false; // Expired
    
    const secret = process.env.JWT_SECRET || 'stone_india_super_secret_jwt_key_2024_ev_battery';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${parseInt(userAnswer, 10)}:${expiry}`)
      .digest('hex');
      
    return signature === expectedSignature;
  } catch (err) {
    console.error('CAPTCHA verification failed:', err);
    return false;
  }
};
