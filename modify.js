const fs = require('fs');
let consultPage = fs.readFileSync('src/app/consult/page.jsx', 'utf8');

consultPage = consultPage.replace(
    '<p className="text-sm">{message.content}</p>',
    '{message.isCrisis && (<div className="mb-2 p-3 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 rounded-r-lg"><p className="text-red-800 dark:text-red-200 font-bold text-xs uppercase tracking-wider mb-1">priority safety alert</p><p className="text-red-700 dark:text-red-300 text-sm">You are not alone. Please reach out to the National Suicide Prevention Lifeline at <strong>988</strong> immediately. They are available 24/7. We strongly encourage you to talk to a trusted friend or counselor right now.</p></div>)}<p className="text-sm whitespace-pre-wrap">{message.content}</p>'
);
fs.writeFileSync('src/app/consult/page.jsx', consultPage);
console.log('Fixed consult display');
