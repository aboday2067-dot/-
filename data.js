'use strict';
/* NovaLearn AI — sample learning content (independent from interface language).
   Replace with real content from your backend later. */
const o=(en,ar)=>({en:en,ar:ar==null?en:ar});

const TRACKS={
  code:{id:'code',title:o('Programming and AI','البرمجة والذكاء الاصطناعي'),desc:o('Start with Python, then learn how AI tools work and how to use them responsibly.','ابدأ ببايثون، ثم تعرّف على طريقة عمل أدوات الذكاء الاصطناعي وكيفية استخدامها بمسؤولية.'),courses:['py','ai']},
  data:{id:'data',title:o('Data Skills','مهارات البيانات'),desc:o('Read tables and charts with care and handle personal data safely.','اقرأ الجداول والرسوم بعناية وتعامل مع البيانات الشخصية بأمان.'),courses:['data']}
};

const COURSES={
py:{id:'py',track:'code',level:o('Beginner','مبتدئ'),icon:'code',mins:45,lab:'tempLab',
  title:o('Python Basics','أساسيات بايثون'),
  desc:o('Write your first programs: print text, store values in variables and build small functions.','اكتب برامجك الأولى: اطبع النص، وخزّن القيم في متغيرات، وابنِ دوال صغيرة.'),
  lessons:[
   {id:'py1',title:o('Your first program','برنامجك الأول'),
    obj:[o('Explain what a program is','شرح معنى البرنامج'),o('Use print() to show text','استخدام print() لعرض نص')],
    body:[
     {t:'p',x:o('A program is a list of instructions the computer follows in order. In Python, the print function shows text on the screen.','البرنامج قائمة تعليمات ينفذها الحاسوب بالترتيب. في بايثون تعرض الدالة print النص على الشاشة.')},
     {t:'code',x:'print("Hello, Nova!")'},
     {t:'note',x:o('Text goes inside quotation marks. Without them, Python looks for a name instead.','يوضع النص بين علامتي اقتباس، وإلا فستبحث بايثون عن اسم بهذا الشكل.')}],
    ex:{prompt:o('Write one line that prints your name.','اكتب سطرًا واحدًا يطبع اسمك.'),re:/print\s*\(\s*["'][^"']+["']\s*\)/,
      ok:o('That matches the expected pattern: print() with text in quotation marks.','هذا يطابق النمط المتوقع: print() مع نص بين علامتي اقتباس.'),
      hint:o('Try print("Your name"). Check the brackets and the quotation marks.','جرّب print("اسمك"). تحقق من الأقواس وعلامتي الاقتباس.')}},
   {id:'py2',title:o('Variables','المتغيرات'),
    obj:[o('Store a value in a variable','تخزين قيمة في متغير'),o('Print the value of a variable','طباعة قيمة متغير')],
    body:[
     {t:'p',x:o('A variable stores a value under a name so you can use it later.','المتغير يخزّن قيمة تحت اسم لتستخدمها لاحقًا.')},
     {t:'code',x:'name = "Sara"\nscore = 20\nprint(name, score)'},
     {t:'note',x:o('The = sign assigns a value. It does not mean "equals" like in maths.','علامة = تُسند قيمة، ولا تعني «يساوي» كما في الرياضيات.')}],
    ex:{prompt:o('Create a variable called city and print it.','أنشئ متغيرًا باسم city واطبعه.'),re:/city\s*=\s*\S+[\s\S]*print\s*\(\s*city\s*\)/,
      ok:o('Good: you created city and printed it.','أحسنت: أنشأت city وطبعته.'),
      hint:o('First assign a value, for example city = "Khartoum", then call print(city).','أسنِد قيمة أولًا مثل city = "Khartoum" ثم استدعِ print(city).')}},
   {id:'py3',title:o('Functions','الدوال'),
    obj:[o('Define a function with def','تعريف دالة باستخدام def'),o('Return a result from a function','إرجاع نتيجة من دالة')],
    body:[
     {t:'p',x:o('A function groups steps you can reuse. def defines it and return sends a result back.','الدالة تجمع خطوات يمكنك إعادة استخدامها. تعرّفها def وترجع النتيجة return.')},
     {t:'code',x:'def double(x):\n    return x * 2\n\nprint(double(4))'},
     {t:'note',x:o('Indentation matters in Python: the lines inside the function are indented.','المسافة البادئة مهمة في بايثون: أسطر الدالة تكون مزاحة إلى الداخل.')}],
    ex:{prompt:o('Write a function add(a, b) that returns their sum.','اكتب دالة add(a, b) ترجع مجموعهما.'),re:/def\s+add\s*\(\s*a\s*,\s*b\s*\)\s*:[\s\S]*return\s+a\s*\+\s*b/,
      ok:o('That matches: add(a, b) returns a + b.','هذا يطابق المطلوب: add(a, b) ترجع a + b.'),
      hint:o('Start with def add(a, b): then indent a line that returns the sum.','ابدأ بـ def add(a, b): ثم اكتب سطرًا مزاحًا يرجع المجموع.')}}
  ],
  quiz:[
   {q:o('Which function shows text on the screen?','أي دالة تعرض النص على الشاشة؟'),opts:[o('print()'),o('show()'),o('echo()'),o('write()')],ans:0,why:o('print() displays values on the screen.','print() تعرض القيم على الشاشة.')},
   {q:o('What does name = "Sara" do?','ماذا تفعل العبارة name = "Sara"؟'),opts:[o('Stores a value in a variable','تخزّن قيمة في متغير'),o('Prints Sara','تطبع Sara'),o('Defines a function','تعرّف دالة'),o('Starts a loop','تبدأ حلقة')],ans:0,why:o('The = sign assigns the text to the variable name.','علامة = تُسند النص إلى المتغير name.')},
   {q:o('What does print(2 + 3 * 2) show?','ماذا تعرض print(2 + 3 * 2)؟'),opts:[o('10'),o('8'),o('12'),o('7')],ans:1,why:o('Multiplication comes first: 3 * 2 = 6, then 2 + 6 = 8.','الضرب أولًا: 3 * 2 = 6 ثم 2 + 6 = 8.')}
  ]},
ai:{id:'ai',track:'code',level:o('Beginner','مبتدئ'),icon:'spark',mins:30,lab:null,
  title:o('AI Literacy','الإلمام بالذكاء الاصطناعي'),
  desc:o('Understand what AI tools can and cannot do, and how to check their answers.','افهم ما تستطيع أدوات الذكاء الاصطناعي فعله وما لا تستطيعه، وكيف تتحقق من إجاباتها.'),
  lessons:[
   {id:'ai1',title:o('What is AI?','ما هو الذكاء الاصطناعي؟'),
    obj:[o('Describe how AI systems learn from examples','وصف كيف تتعلم أنظمة الذكاء الاصطناعي من الأمثلة'),o('Explain why a fluent answer can still be wrong','شرح لماذا قد تكون الإجابة السلسة خاطئة')],
    body:[
     {t:'p',x:o('AI systems find patterns in large amounts of data. They predict likely outputs. They do not look up verified facts unless they are connected to a reliable source.','أنظمة الذكاء الاصطناعي تكتشف الأنماط في كميات كبيرة من البيانات وتتوقع المخرجات المحتملة، ولا تبحث عن حقائق موثقة ما لم ترتبط بمصدر موثوق.')},
     {t:'note',x:o('A fluent answer is not proof that it is correct.','الإجابة السلسة ليست دليلًا على صحتها.')}]},
   {id:'ai2',title:o('Using AI responsibly','استخدام الذكاء الاصطناعي بمسؤولية'),
    obj:[o('Check important answers against trusted sources','التحقق من الإجابات المهمة بمصادر موثوقة'),o('Protect private information','حماية المعلومات الخاصة')],
    body:[
     {t:'p',x:o('Good habits help you learn with AI instead of copying from it:','العادات الجيدة تساعدك على التعلم مع الذكاء الاصطناعي بدل النسخ منه:')},
     {t:'ul',x:[o('Verify important answers with a trusted source.','تحقق من الإجابات المهمة بمصدر موثوق.'),o('Do not share passwords or personal details.','لا تشارك كلمات المرور أو التفاصيل الشخصية.'),o('Try the problem yourself first, then ask for a hint.','جرّب المسألة بنفسك أولًا ثم اطلب تلميحًا.')]}]}
  ],
  quiz:[
   {q:o('Which statement is true?','أي العبارات صحيحة؟'),opts:[o('AI answers can sound confident and still be wrong','قد تبدو إجابات الذكاء الاصطناعي واثقة وتكون خاطئة'),o('AI always checks facts before it answers','الذكاء الاصطناعي يتحقق من الحقائق دائمًا قبل أن يجيب'),o('AI knows your private files automatically','الذكاء الاصطناعي يعرف ملفاتك الخاصة تلقائيًا'),o('A longer answer is always more accurate','الإجابة الأطول أدق دائمًا')],ans:0,why:o('Fluent text is not evidence. Models predict likely text.','النص السلس ليس دليلًا، فالنماذج تتوقع النص المحتمل.')},
   {q:o('What should you do before relying on an AI answer for something important?','ماذا تفعل قبل الاعتماد على إجابة الذكاء الاصطناعي في أمر مهم؟'),opts:[o('Verify it with a trusted source','تتحقق منها بمصدر موثوق'),o('Share it immediately','تشاركها فورًا'),o('Delete the question','تحذف السؤال'),o('Ask the same AI to agree','تطلب من الأداة نفسها أن توافق')],ans:0,why:o('Independent verification catches mistakes.','التحقق المستقل يكشف الأخطاء.')},
   {q:o('AI systems mainly learn by...','تتعلم أنظمة الذكاء الاصطناعي أساسًا عن طريق...'),opts:[o('Finding patterns in many examples','اكتشاف الأنماط في أمثلة كثيرة'),o('Memorising every website','حفظ كل المواقع'),o('Being programmed with every answer','برمجتها بكل إجابة'),o('Copying the user','تقليد المستخدم')],ans:0,why:o('Models learn statistical patterns from examples.','النماذج تتعلم أنماطًا إحصائية من الأمثلة.')}
  ]},
data:{id:'data',track:'data',level:o('Beginner','مبتدئ'),icon:'chart',mins:40,lab:'privacyLab',
  title:o('Data Literacy','الإلمام بالبيانات'),
  desc:o('Read tables and charts carefully and share data without exposing people.','اقرأ الجداول والرسوم بعناية وشارك البيانات دون كشف هوية الأشخاص.'),
  lessons:[
   {id:'data1',title:o('Reading tables and charts','قراءة الجداول والرسوم'),
    obj:[o('Check what a chart measures and in which units','التحقق مما يقيسه الرسم وبأي وحدات'),o('Spot missing values and unclear scales','ملاحظة القيم الناقصة والمقاييس غير الواضحة')],
    body:[
     {t:'p',x:o('Start with the title, the units and the axis labels before you look at the shape of the data.','ابدأ بالعنوان والوحدات وتسميات المحاور قبل النظر إلى شكل البيانات.')},
     {t:'ul',x:[o('What is being measured?','ما الذي يُقاس؟'),o('Which period and which units?','ما الفترة وما الوحدات؟'),o('Are there missing values?','هل توجد قيم ناقصة؟')]},
     {t:'note',x:o('A chart that starts its axis above zero can make small differences look large.','الرسم الذي يبدأ محوره فوق الصفر قد يجعل الفروق الصغيرة تبدو كبيرة.')}]},
   {id:'data2',title:o('Handling personal data','التعامل مع البيانات الشخصية'),
    obj:[o('Recognise direct identifiers','التعرف على المعرّفات المباشرة'),o('Share only what the analysis needs','مشاركة ما يحتاجه التحليل فقط')],
    body:[
     {t:'p',x:o('Names and phone numbers can reveal who someone is. Share only the columns your analysis needs.','الأسماء وأرقام الهواتف قد تكشف هوية الشخص. شارك الأعمدة التي يحتاجها تحليلك فقط.')},
     {t:'note',x:o('Removing the name column is not always enough. Combinations such as city and age can still identify a person in a small group.','حذف عمود الاسم لا يكفي دائمًا. فقد تكشف تركيبات مثل المدينة والعمر هوية شخص في مجموعة صغيرة.')}]}
  ],
  quiz:[
   {q:o('Which column is most clearly a personal identifier?','أي عمود هو معرّف شخصي بوضوح أكبر؟'),opts:[o('Phone number','رقم الهاتف'),o('Score','الدرجة'),o('Course name','اسم المقرر'),o('Year','السنة')],ans:0,why:o('A phone number points directly to one person.','رقم الهاتف يشير مباشرة إلى شخص واحد.')},
   {q:o('A good chart always includes...','الرسم الجيد يتضمن دائمًا...'),opts:[o('A title, labels and units','عنوانًا وتسميات ووحدات'),o('Only colours','ألوانًا فقط'),o('A 3D effect','تأثيرًا ثلاثي الأبعاد'),o('No axis','بلا محاور')],ans:0,why:o('Titles, labels and units tell readers what they are looking at.','العنوان والتسميات والوحدات تخبر القارئ بما يراه.')},
   {q:o('What is the average of 2, 4 and 9?','ما متوسط الأعداد 2 و4 و9؟'),opts:[o('4'),o('5'),o('6'),o('15')],ans:1,why:o('(2 + 4 + 9) ÷ 3 = 5.','(2 + 4 + 9) ÷ 3 = 5.')}
  ]}
};
const COURSE_ORDER=['py','ai','data'];

const LABS={
tempLab:{id:'tempLab',course:'py',kind:'code',
  title:o('Temperature converter','محوّل درجات الحرارة'),
  brief:o('Write a Python function that converts Celsius to Fahrenheit and returns the result. Then call it with 100.','اكتب دالة بايثون تحوّل من سيلزيوس إلى فهرنهايت وترجع النتيجة، ثم استدعها بالقيمة 100.'),
  starter:'def celsius_to_f(c):\n    # write your code here\n',
  hints:[o('Fahrenheit = Celsius * 9 / 5 + 32.','فهرنهايت = سيلزيوس * 9 / 5 + 32.'),o('Use return to send the result back.','استخدم return لإرجاع النتيجة.')],
  criteria:[
   {id:'def',ess:true,w:25,label:o('Defines a function with def','يعرّف دالة باستخدام def'),test:s=>/def\s+\w+\s*\(\s*\w+\s*\)\s*:/.test(s.code)},
   {id:'ret',ess:true,w:25,label:o('Returns a value','يرجع قيمة'),test:s=>/return\s+\S+/.test(s.code)},
   {id:'frm',ess:false,w:25,label:o('Uses the conversion formula','يستخدم صيغة التحويل'),test:s=>/(9\s*\/\s*5|1\.8)/.test(s.code)&&/32/.test(s.code)},
   {id:'call',ess:false,w:25,label:o('Calls the function with 100','يستدعي الدالة بالقيمة 100'),test:s=>/\w+\s*\(\s*100\s*\)/.test(s.code.replace(/def\s+\w+\s*\([^)]*\)/,''))}
  ]},
privacyLab:{id:'privacyLab',course:'data',kind:'data',
  title:o('Share a dataset safely','شارك مجموعة بيانات بأمان'),
  brief:o('You want to share this table so someone can analyse scores by city. Choose the columns to remove before sharing and explain your choice in a sentence.','تريد مشاركة هذا الجدول ليحلّل شخص الدرجات حسب المدينة. اختر الأعمدة التي تحذفها قبل المشاركة واشرح اختيارك في جملة.'),
  cols:[{id:'name',l:o('Name','الاسم')},{id:'phone',l:o('Phone','الهاتف')},{id:'city',l:o('City','المدينة')},{id:'score',l:o('Score','الدرجة')}],
  rows:[['Amna','0900 000 001','Omdurman','82'],['Omar','0900 000 002','Khartoum','74'],['Huda','0900 000 003','Omdurman','91']],
  hints:[o('Ask which columns point directly to one person.','اسأل: أي الأعمدة تشير مباشرة إلى شخص واحد؟'),o('City is an indirect identifier. It is acceptable here but can matter in small groups.','المدينة معرّف غير مباشر. مقبولة هنا لكنها قد تهم في المجموعات الصغيرة.')],
  criteria:[
   {id:'rn',ess:true,w:30,label:o('Removes the name column','يحذف عمود الاسم'),test:s=>s.remove.includes('name')},
   {id:'rp',ess:true,w:30,label:o('Removes the phone column','يحذف عمود الهاتف'),test:s=>s.remove.includes('phone')},
   {id:'ks',ess:false,w:25,label:o('Keeps the score column needed for the analysis','يُبقي عمود الدرجة اللازم للتحليل'),test:s=>!s.remove.includes('score')},
   {id:'re',ess:false,w:15,label:o('Explains the choice in a sentence','يشرح الاختيار في جملة'),test:s=>(s.reason||'').trim().length>=20}
  ]}
};

const SPARKS=[
 {q:o('Which symbol assigns a value to a variable in Python?','أي رمز يُسند قيمة إلى متغير في بايثون؟'),opts:[o('='),o('=='),o('=>')],ans:0,why:o('= assigns. == compares two values.','= تُسند، و== تقارن بين قيمتين.')},
 {q:o('Before trusting an AI answer about health or money, what is the best step?','قبل الوثوق بإجابة ذكاء اصطناعي عن الصحة أو المال، ما أفضل خطوة؟'),opts:[o('Check a trusted source','الرجوع إلى مصدر موثوق'),o('Trust the first answer','تصديق الإجابة الأولى'),o('Ask again until it agrees','السؤال مرارًا حتى توافق')],ans:0,why:o('Important decisions need independent checking.','القرارات المهمة تحتاج إلى تحقق مستقل.')},
 {q:o('Which of these is a direct personal identifier?','أي مما يلي معرّف شخصي مباشر؟'),opts:[o('National ID number','رقم الهوية الوطنية'),o('Favourite colour','اللون المفضل'),o('Course level','مستوى المقرر')],ans:0,why:o('An ID number points to one person.','رقم الهوية يشير إلى شخص واحد.')},
 {q:o('What does return do in a function?','ماذا تفعل return في الدالة؟'),opts:[o('Sends a result back to the caller','ترسل نتيجة إلى من استدعى الدالة'),o('Prints text','تطبع نصًا'),o('Deletes the function','تحذف الدالة')],ans:0,why:o('return ends the function and gives back a value.','return تنهي الدالة وتُرجع قيمة.')},
 {q:o('A chart axis that starts above zero can...','محور الرسم الذي يبدأ فوق الصفر قد...'),opts:[o('Make small differences look large','يجعل الفروق الصغيرة تبدو كبيرة'),o('Make the chart more accurate','يجعل الرسم أدق'),o('Remove the need for labels','يلغي الحاجة إلى التسميات')],ans:0,why:o('Truncated axes exaggerate differences.','المحاور المقتطعة تضخّم الفروق.')}
];

/* Sample cohort for the administration view: pseudonymised, not real people. */
const COHORT=[
 {id:'L-01',les:{py:100,ai:100,data:100},quiz:{py:100,ai:100,data:67},ver:{py:true,ai:false,data:false},last:1},
 {id:'L-02',les:{py:67,ai:50,data:0},quiz:{py:67,ai:100,data:0},ver:{py:false,ai:false,data:false},last:2},
 {id:'L-03',les:{py:100,ai:100,data:50},quiz:{py:100,ai:67,data:67},ver:{py:true,ai:false,data:false},last:1},
 {id:'L-04',les:{py:33,ai:0,data:0},quiz:{py:0,ai:0,data:0},ver:{py:false,ai:false,data:false},last:9},
 {id:'L-05',les:{py:100,ai:100,data:100},quiz:{py:100,ai:100,data:100},ver:{py:true,ai:false,data:true},last:0},
 {id:'L-06',les:{py:100,ai:50,data:100},quiz:{py:67,ai:0,data:100},ver:{py:false,ai:false,data:true},last:3},
 {id:'L-07',les:{py:0,ai:100,data:50},quiz:{py:0,ai:100,data:33},ver:{py:false,ai:false,data:false},last:5},
 {id:'L-08',les:{py:67,ai:100,data:100},quiz:{py:100,ai:100,data:67},ver:{py:false,ai:false,data:false},last:2}
];
