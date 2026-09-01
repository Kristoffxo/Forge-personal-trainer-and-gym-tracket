/* ---------------------------------------------------------------
   English and Hinglish.

   Hinglish here means Hindi written in the Latin alphabet — "kaise
   ho", never "कैसे हो". Devanagari is deliberately absent: plenty of
   people who speak Hindi every day read it far more slowly than they
   read Roman letters, and this app is meant to be equally easy for
   someone with a doctorate and someone who left school at fourteen.

   The key is the English string itself. That means:
     - a missing translation falls back to readable English rather
       than to a key name leaking onto the screen
     - adding a screen needs no key invention, just t('...')

   Words that Indians already say in English stay in English —
   workout, protein, calories, set, reps, gym. Translating those into
   Sanskritised Hindi would make the app harder to read, not easier.
   --------------------------------------------------------------- */
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* Still 'nemea:' — these are the keys people's saved settings are
   already under. Renaming them does not migrate anything, it just
   loses everybody's language, theme and side on next open. */
const KEY = 'nemea:lang';

/* english: hinglish */
const HI = {
  /* ---------- tabs and chrome ---------- */
  'Train': 'Train',
  'Today’s workout': 'Aaj ka workout',
  'Food': 'Khana',
  'What you ate today': 'Aaj kya khaya',
  'Feed': 'Feed',
  'How everyone is doing': 'Dekho sab kaise kar rahe hain',
  'You': 'Aap',
  'Your streak and numbers': 'Aapki streak aur numbers',

  /* ---------- sign in ---------- */
  'Sign in': 'Sign in karo',
  'Create account': 'Account banao',
  'Create my account': 'Mera account banao',
  'Email': 'Email',
  'Password': 'Password',
  'Your name': 'Aapka naam',
  'at least 6 characters': 'kam se kam 6 characters',
  'you@email.com': 'aap@email.com',
  'Your password is never stored by this app.': 'Aapka password ye app kabhi save nahi karta.',
  'Performance, redefined.': 'Performance, nayi paribhasha.',
  'Almost there — confirm the link in your email, then sign in.':
    'Bas ho gaya — apne email ka link confirm karo, phir sign in karo.',
  'Wrong email or password.': 'Email ya password galat hai.',
  'That email already has an account. Sign in instead.':
    'Is email ka account pehle se hai. Sign in karo.',
  'Password needs at least 6 characters.': 'Password mein kam se kam 6 characters chahiye.',
  'That does not look like a valid email.': 'Ye email sahi nahi lag raha.',
  'No internet connection.': 'Internet nahi chal raha.',
  'Something went wrong. Try again.': 'Kuch gadbad ho gayi. Phir se try karo.',

  /* ---------- training ---------- */
  'Today': 'Aaj',
  'Your week': 'Aapka hafta',
  'Rest': 'Rest',
  'Rest day. Walk, sleep, eat well.': 'Aaj rest. Thoda chalo, achhi neend lo, achha khao.',
  'Train anyway': 'Phir bhi train karo',
  'Start today’s workout': 'Aaj ka workout shuru karo',
  'Start this workout': 'Ye workout shuru karo',
  'Finish workout': 'Workout khatam karo',
  'Finish — well done': 'Khatam — shabaash',
  'Tap a move to see how it is done': 'Kisi exercise pe tap karo, dekho kaise karni hai',
  'Finish early?': 'Abhi khatam karna hai?',
  'Finish anyway': 'Haan, khatam karo',
  'Let’s build your week': 'Chalo aapka hafta banate hain',
  'Change your plan': 'Apna plan badlo',
  'Two questions. Change it any time.': 'Do sawaal. Kabhi bhi badal sakte ho.',
  'How often can you train?': 'Hafte mein kitni baar train kar sakte ho?',
  'What do you train with?': 'Kis cheez se train karte ho?',
  'A gym': 'Gym',
  'Just my body': 'Sirf apni body',
  'Build my week': 'Mera hafta banao',
  'Save': 'Save karo',
  'Cancel': 'Cancel',
  'Tap the muscles for each day': 'Har din ke liye muscles chuno',
  'Rest day': 'Rest day',
  'tap': 'tap',
  'Short. Good for a busy week.': 'Chhota. Busy hafte ke liye theek.',
  'About right for most people.': 'Zyaadatar logon ke liye sahi.',
  'A lot. Only if you recover well.': 'Bahut zyada. Tabhi karo jab recovery achhi ho.',

  /* ---------- one exercise ---------- */
  'Back': 'Wapas',
  'How to do it': 'Kaise karni hai',
  'Last time': 'Pichli baar',
  'Your best': 'Aapka best',
  'Numbers are optional. Tick the set either way.':
    'Numbers likhna zaroori nahi. Set ho gaya to tick kar do.',
  'Done — next exercise': 'Ho gaya — agli exercise',
  'Done — finish workout': 'Ho gaya — workout khatam',
  'kg': 'kg',
  'reps': 'reps',
  'today': 'aaj',
  'yesterday': 'kal',
  'last week': 'pichle hafte',

  /* ---------- feed ---------- */
  'Post today’s photo': 'Aaj ki photo daalo',
  'Posted today': 'Aaj daal di',
  'One a day. Your first name only.': 'Din mein ek. Sirf aapka pehla naam.',
  'Come back tomorrow.': 'Kal phir aana.',
  'Nobody has posted yet': 'Abhi tak kisi ne kuch nahi daala',
  'See how everyone is doing, and let them see you. Post first.':
    'Dekho sab kaise kar rahe hain, aur unhe apna dikhao. Pehle aap daalo.',
  'Add a comment': 'Comment karo',
  'Take a photo': 'Photo kheencho',
  'Pick one instead': 'Ya gallery se chuno',
  'Tap to change': 'Badalne ke liye tap karo',
  'All anyone sees. No username, no location.':
    'Bas yehi sabko dikhta hai. Na username, na location.',
  'Caption': 'Kuch likho',
  'Say something (optional)': 'Kuch likho (zaroori nahi)',
  'Post': 'Post karo',
  'No comments yet.': 'Abhi koi comment nahi.',
  'Load more': 'Aur dikhao',
  'Already posted today': 'Aaj already daal di',
  'One a day. It keeps the feed worth scrolling.':
    'Din mein ek. Isse feed dekhne layak rehti hai.',
  'Back to the feed': 'Feed pe wapas',
  'Today’s photo': 'Aaj ki photo',
  'The feed is not ready': 'Feed abhi tayaar nahi hai',
  'Delete': 'Delete karo',
  'Delete this post?': 'Ye post delete karein?',
  'It disappears for everyone, along with its comments.':
    'Sabke liye hat jayegi, comments ke saath.',
  'Report this post': 'Is post ki report karo',
  'Report this comment': 'Is comment ki report karo',
  'Reported': 'Report ho gayi',
  'Thanks — we will take a look.': 'Shukriya — hum dekh lenge.',
  'Delete your comment?': 'Apna comment delete karein?',
  'Could not comment': 'Comment nahi hua',
  'Could not delete': 'Delete nahi hua',
  'Could not block': 'Block nahi hua',
  'Write something first.': 'Pehle kuch likho.',
  'just now': 'abhi',

  /* ---------- food ---------- */
  'Breakfast': 'Nashta',
  'Lunch': 'Lunch',
  'Dinner': 'Dinner',
  'Snacks': 'Snacks',
  'Protein': 'Protein',
  'Carbs': 'Carbs',
  'Fat': 'Fat',
  'left': 'bacha',
  'over': 'zyada',
  'Hold an item to remove it': 'Hataane ke liye dabaye rakho',
  'Remove this?': 'Isse hatana hai?',
  'Remove': 'Hatao',
  'Keep it': 'Rehne do',
  'Search foods': 'Khana dhundo',
  'Common foods': 'Aam khane',
  'Quantity': 'Kitna',
  'Serving': 'Portion',
  'Add to diary': 'Diary mein add karo',
  'Nothing matched. Try a simpler word — "chicken", not "grilled chicken breast".':
    'Kuch nahi mila. Aasaan shabd try karo — "chicken", "grilled chicken breast" nahi.',

  /* ---------- you ---------- */
  'Progress': 'Progress',
  'Numbers': 'Numbers',
  'day in a row': 'din lagataar',
  'days in a row': 'din lagataar',
  'Log anything today to start.': 'Aaj kuch bhi log karo, count shuru ho jayega.',
  'Weight': 'Wazan',
  'kg today': 'aaj ka kg',
  'Log': 'Log karo',
  'Saved': 'Save ho gaya',
  'Your weight stays on this device.': 'Aapka wazan sirf is phone mein rehta hai.',
  'Body Mass Index': 'Body Mass Index',
  'Height (cm)': 'Height (cm)',
  'Weight (kg)': 'Wazan (kg)',
  'Daily calorie target': 'Roz ka calorie target',
  'kcal a day': 'roz ki kcal',
  'The Food tab counts down from this.': 'Khana tab isi se ginti karta hai.',
  'Save my numbers': 'Mere numbers save karo',
  'Account': 'Account',
  'Sign out': 'Sign out karo',
  'Know your numbers': 'Apne numbers jaano',
  'Tools': 'Tools',
  'Underweight': 'Wazan kam hai',
  'Healthy': 'Sahi hai',
  'Overweight': 'Wazan zyada hai',
  'Obese': 'Wazan bahut zyada hai',
  'ENTER YOUR NUMBERS': 'APNE NUMBERS DAALO',

  /* ---------- sheet ---------- */
  'Yes': 'Haan',
  'OK': 'Theek hai',

  /* ---------- admin ---------- */
  'on the feed': 'feed pe',
  'reported': 'report hui',
  'Nothing posted yet.': 'Abhi kuch post nahi hua.',
  'Reports': 'Reports',
  'Posts delete themselves after 7 days. Tap any photo to remove it now.':
    '7 din baad post apne aap hat jaati hai. Abhi hataana ho to photo pe tap karo.',

  /* ---------- form cues, one per line so they stay greppable ---------- */
  'Sit down between your hips, not backwards':
    'Neeche baitho, peeche mat jhuko',
  'Knees track over your toes, never inward':
    'Ghutne panjon ki seedh mein rahein, andar na mudein',
  'Chest up the whole way — depth before load':
    'Seena upar rakho — pehle depth, phir weight',
  'Arms come up as you go down — it keeps you balanced':
    'Neeche jaate waqt haath aage — balance banega',
  'Heels stay flat on the floor':
    'Ediyan zameen pe tiki rahein',
  'Three seconds down, one up, once it feels easy':
    'Teen second neeche, ek upar — jab aasaan lage',
  'Bring the sled down until your knees reach 90°':
    'Utna neeche laao ki ghutne 90° pe aa jayein',
  'Do not let your lower back round off the pad':
    'Kamar pad se uthni nahi chahiye',
  'Stop just short of locking the knees out':
    'Ghutne poore lock mat karo, thoda pehle ruko',
  'Push your hips back — this is a hinge, not a squat':
    'Kamar peeche dhakelo — ye hinge hai, squat nahi',
  'Bar stays in contact with your legs the whole way':
    'Bar poori tarah tangon se lagi rahe',
  'Stand up by squeezing your glutes, not pulling with your back':
    'Uthte waqt kulhe dabao, kamar se mat kheencho',
  'Take the slack out of the bar before you pull':
    'Kheenchne se pehle bar ka slack nikaalo',
  'Hips and shoulders rise together':
    'Kamar aur kandhe saath uthein',
  'Finish standing tall — do not lean back at the top':
    'Seedhe khade ho ke khatam karo — peeche mat jhuko',
  'Squeeze at the top until your body makes a straight line':
    'Upar dabao jab tak body seedhi line na ban jaye',
  'Chin tucked, ribs down — do not arch your back':
    'Thodi andar, pasliyan neeche — kamar mat moDo',
  'Drive through your heels':
    'Ediyon se zor lagao',
  'Touch your chest, do not bounce off it':
    'Seene ko chhuo, uchaalo mat',
  'Elbows about 45° from your body, not flared wide':
    'Kohniyan body se 45° pe, poori bahar nahi',
  'Shoulder blades pinched back and down throughout':
    'Kandhe poora time peeche aur neeche daba ke rakho',
  'Body stays one straight line from head to heels':
    'Sar se edi tak body ek seedhi line',
  'Lower until your chest is a fist off the floor':
    'Utna neeche jao ki seena zameen se ek mutthi upar ho',
  'Push the floor away rather than just bending your arms':
    'Zameen ko dhakelo, sirf haath mat modo',
  'Lean forward a little to bias the chest':
    'Thoda aage jhuko — seene pe zyada lagega',
  'Go down until your upper arms are level with the floor':
    'Utna neeche jao ki upar wale haath zameen ke barabar ho',
  'Stop if you feel it pinch at the front of your shoulder':
    'Kandhe ke aage chubhe to ruk jao',
  'Soft bend in the elbows, held the whole set':
    'Kohniyan halki mudi rahein, poore set',
  'Open until you feel a stretch across the chest, no further':
    'Utna kholo ki seene mein khinchav lage, usse zyada nahi',
  'Think about hugging a barrel, not pressing':
    'Socho ki drum ko gale laga rahe ho, press nahi kar rahe',
  'Squeeze your glutes so you do not arch backwards':
    'Kulhe dabao taaki kamar peeche na mude',
  'Move your head back out of the way, then push up':
    'Sar peeche karo, phir upar dhakelo',
  'Finish with the bar over the middle of your foot':
    'Bar paer ke beech ke upar aa ke rukni chahiye',
  'Lead with your elbows, not your hands':
    'Kohniyon se uthao, haathon se nahi',
  'Stop at shoulder height — higher brings the traps in':
    'Kandhe ki height pe ruko — upar gaye to traps lagenge',
  'Lower it slowly; that half is the whole exercise':
    'Dheere neeche laao — asli exercise wahi hai',
  'Pull your elbows down toward your back pockets':
    'Kohniyan peechhe jeb ki taraf kheencho',
  'Bring the bar to your collarbone, in front of your head':
    'Bar sar ke aage, hansli tak laao',
  'Let the weight stretch your lats at the top':
    'Upar weight ko lats kheenchne do',
  'Start from a dead hang, arms straight':
    'Poore latak ke shuru karo, haath seedhe',
  'Pull until your chin clears the bar':
    'Thodi bar ke upar aane tak kheencho',
  'Lower under control — do not drop':
    'Control se neeche aao — girao mat',
  'Back flat and chest proud before you pull anything':
    'Kheenchne se pehle kamar seedhi, seena bahar',
  'Pull to your belly button, not your chest':
    'Naabhi tak kheencho, seene tak nahi',
  'Squeeze your shoulder blades together at the top':
    'Upar kandhon ko aapas mein dabao',
  'Sit tall — do not row with your lower back':
    'Seedhe baitho — kamar se mat kheencho',
  'Elbows stay close to your sides':
    'Kohniyan body ke paas rahein',
  'Let your shoulder blades open at the front of the rep':
    'Aage jaate waqt kandhon ko khulne do',
  'Pull the rope toward your eyebrows':
    'Rope ko bhauhon ki taraf kheencho',
  'Finish with your knuckles pointing behind you':
    'Ungliyon ke jod peeche ki taraf ho ke khatam',
  'Light weight. This one is for the small muscles':
    'Halka weight. Ye chhote muscles ke liye hai',
  'Elbows pinned to your sides — they do not travel':
    'Kohniyan body se chipki rahein — hilni nahi chahiye',
  'No swing. If your back moves, the weight is too heavy':
    'Jhatka mat do. Kamar hile to weight zyada hai',
  'Lower it all the way down each rep':
    'Har rep mein poora neeche laao',
  'Upper arms stay still — only the forearms move':
    'Upar wale haath sthir — sirf kalai wala hissa chale',
  'Push all the way to straight and hold for a beat':
    'Poora seedha karo aur ek pal ruko',
  'Keep your elbows tucked in, not flaring out':
    'Kohniyan andar rakho, bahar nahi',
  'Elbows point forward and stay there':
    'Kohniyan aage ki taraf, wahin rahein',
  'Lower until you feel the stretch behind your arm':
    'Utna neeche jao ki haath ke peeche khinchav lage',
  'Ribs down — do not let your back arch':
    'Pasliyan neeche — kamar ko mudne mat do',
  'Drop straight down — the back knee goes to the floor':
    'Seedha neeche jao — peeche wala ghutna zameen tak',
  'Front shin stays close to vertical':
    'Aage wali pindli seedhi rahe',
  'Push back up through the front heel':
    'Aage wali edi se zor laga ke utho',
  'Straighten fully and squeeze for a count':
    'Poora seedha karo aur ek ginti dabao',
  'Lower slowly — do not let the stack drop':
    'Dheere neeche laao — weight girne mat do',
  'Keep your hips pressed into the seat':
    'Kamar seat se lagi rahe',
  'Curl your heel toward your backside':
    'Edi ko peeche kulhe ki taraf modo',
  'Hips stay down on the pad':
    'Kamar pad pe tiki rahe',
  'Slow on the way back — hamstrings hate the negative':
    'Wapas aate waqt dheere — hamstrings ko yahi lagta hai',
  'All the way up onto your toes, hold for a second':
    'Poora panjon pe utho, ek second ruko',
  'All the way down until you feel the stretch':
    'Poora neeche jao jab tak khinchav na lage',
  'Do not bounce — the bounce is your tendons, not your calves':
    'Uchalo mat — uchhaal tendon karte hain, calves nahi',
  'Squeeze your glutes — that is what stops the sag':
    'Kulhe dabao — isi se kamar nahi jhukegi',
  'Ribs pulled down, hips level with your shoulders':
    'Pasliyan neeche, kamar kandhon ke barabar',
  'Breathe. If you cannot talk, come down':
    'Saans lo. Baat na kar pao to utar jao',
  'Curl your ribs toward your hips':
    'Pasliyon ko kamar ki taraf modo',
  'Do not pull on your neck':
    'Gardan mat kheencho',
  'Short range, slow, and squeeze at the top':
    'Chhota movement, dheere, upar dabao',
  'Stop yourself swinging before the first rep':
    'Pehle rep se pehle jhoolna band karo',
  'Curl your hips up at the top — that is the ab part':
    'Upar kamar ko modo — abs wahin lagte hain',
  'Lower slowly, all the way to a hang':
    'Dheere neeche aao, poora latak tak',
  'Go only as far as you can keep your back flat':
    'Utna hi jao jitna kamar seedhi rakh sako',
  'Ribs down and hips tucked the whole way out':
    'Poore time pasliyan neeche, kamar andar',
  'If your lower back arches, you have gone too far':
    'Kamar mudne lage to samjho zyada aage chale gaye',
  'Squeeze at the top for a full second':
    'Upar poore ek second dabao',
  'Push through your heels':
    'Ediyon se zor lagao',
  'Do not arch — the movement is your hips, not your back':
    'Kamar mat modo — movement kulhon se hai, kamar se nahi',
  'Stand tall — shoulders back, ribs down':
    'Seedhe khade raho — kandhe peeche, pasliyan neeche',
  'Small, steady steps':
    'Chhote, sthir kadam',
  'Grip is the point. Put it down when the grip goes':
    'Grip hi asli cheez hai. Grip chhoote to rakh do',
  'Ease into it — never bounce':
    'Aaram se jao — jhatka kabhi nahi',
  'Breathe out as you go deeper':
    'Gehra jaate waqt saans chhodo',
  'Mild tension, never pain':
    'Halka khinchav, dard kabhi nahi',

  /* ---------- odds and ends picked up while translating ---------- */
  'moves':
    'exercise',
  'minutes':
    'minute',
  'mein se':
    'mein se',
  'done':
    'ho gaye',
  'a session':
    'har session',
  'change':
    'badlo',
  'moves still to go.':
    'exercise abhi baaki hain.',
  'exercises a session':
    'exercise har session',
  'Sets':
    'Sets',
  'aim for':
    'target',
  'comments':
    'comment',
  'Comment as':
    'Comment karo',
  'mein add karo':
    'mein add karo',
  'Last':
    'Pichle',
  'days':
    'din',
  'din log kiye.':
    'din log kiye.',
  'Push · Pull · Legs':
    'Push · Pull · Legs',
  'Upper · Lower':
    'Upper · Lower',
  'Full Body':
    'Full Body',
  'One Muscle a Day':
    'Ek Din Ek Muscle',
  'Build My Own':
    'Khud Banao',
  'Push':
    'Push',
  'Pull':
    'Pull',
  'Legs':
    'Legs',
  'Arms':
    'Arms',
  '6 days a week':
    'hafte mein 6 din',
  '3 days a week':
    'hafte mein 3 din',
  '4 days a week':
    'hafte mein 4 din',
  '5 days a week':
    'hafte mein 5 din',
  'you choose':
    'aap chuno',
  'The classic. Every muscle trained twice a week. Best results if you can commit.':
    'Sabse purana tareeka. Har muscle hafte mein do baar. Time de sako to sabse achha.',
  'Same idea, half the time. Good if you train Monday, Wednesday, Friday.':
    'Wahi cheez, aadhe time mein. Somvaar, Budhvaar, Shukravaar ke liye theek.',
  'Two upper days, two lower days. The easiest split to stick to.':
    'Do din upar, do din neeche. Isse nibhana sabse aasaan hai.',
  'Everything, every session. Best if you are new or short on days.':
    'Har session mein sab kuch. Naye ho ya time kam ho to sahi.',
  'Chest day, back day, leg day, shoulder day, arm day. Simple to follow.':
    'Chest day, back day, leg day, shoulder day, arm day. Samajhne mein aasaan.',
  'Pick which muscles you train on each day of the week.':
    'Hafte ke har din ke liye khud muscles chuno.',
  'Below the healthy range. Eating more is the priority, not training harder.':
    'Wazan kam hai. Zyada khana zaroori hai, zyada training nahi.',
  'Right where you want to be. Keep doing what you are doing.':
    'Bilkul sahi jagah pe ho. Jo kar rahe ho karte raho.',
  'A little above. A small daily calorie deficit is the lever.':
    'Thoda zyada hai. Roz thodi kam calories khao.',
  'Well above the healthy range. Structured coaching matters most here.':
    'Kaafi zyada hai. Yahan sahi guidance sabse zaroori hai.',

  /* ---------- trainer and credits ---------- */
  'Trainer': 'Trainer',
  'Ask a real trainer': 'Asli trainer se poocho',
  'A real trainer answers': 'Jawab ek asli trainer deta hai',
  'Not a bot, and not a model pretending to be one. A person reads your question and writes back, so give it a few hours.':
    'Koi bot nahi, koi AI nahi. Ek insaan aapka sawaal padhta hai aur jawab likhta hai, toh thoda waqt lagta hai.',
  'Your credits': 'Aapke credits',
  'One credit per line. Ten credits is a ten-line question.':
    'Ek line ka ek credit. Das credit matlab das line ka sawaal.',
  'for': 'ke',
  'Top up': 'Credits lo',
  'Opening…': 'Khul raha hai…',
  'Paid securely through Razorpay. Credits arrive on their own.':
    'Razorpay se safe payment. Credits khud aa jaate hain.',
  'Payments are not switched on yet — nothing on this screen can charge you.':
    'Payment abhi chalu nahi hai — is screen se koi paisa nahi katega.',
  'Payments are not switched on yet': 'Payment abhi chalu nahi hai',
  'Nothing has been charged. The gateway needs its keys setting on the server first.':
    'Koi paisa nahi kata. Pehle server pe payment ki keys lagani hongi.',
  'Payment problem': 'Payment mein dikkat',
  'Payment received': 'Payment mil gaya',
  'Your credits are on their way and usually land within a minute. Pull the screen to refresh.':
    'Aapke credits aa rahe hain, ek minute mein aa jaate hain. Screen kheench ke refresh karo.',
  'Credits added': 'Credits aa gaye',
  'You now have': 'Ab aapke paas hain',
  'credits': 'credits',
  'credit': 'credit',
  'Your questions': 'Aapke sawaal',
  'Nothing yet. Ask anything — form, a plan, an injury, what to eat.':
    'Abhi kuch nahi. Kuch bhi poocho — form, plan, chot, kya khaana hai.',
  'Ask the trainer something': 'Trainer se kuch poocho',
  'Up to': 'Zyada se zyada',
  'lines': 'line',
  'Send': 'Bhejo',
  'Not enough credits': 'Credits kam hain',
  'That question costs': 'Us sawaal ka kharcha hai',
  'You have': 'Aapke paas hain',
  'Could not send': 'Bheja nahi ja saka',

  /* ---------- men and women ---------- */
  'Men': 'Mard',
  'Women': 'Aurat',

  /* Muscle and target names stay in English on purpose. Everybody at
     a gym in India says "glutes" and "core"; translating them would
     make the app harder to read, not easier. Only the sentences
     around them change. */
  'Glutes & Thighs': 'Glutes & Thighs',
  'Lower Body': 'Lower Body',
  'Upper Body': 'Upper Body',
  'Arms & Back': 'Arms & Back',
  'Glutes · Legs · Upper': 'Glutes · Legs · Upper',
  'Lower · Upper': 'Lower · Upper',
  'One Area a Day': 'Ek Din Ek Hissa',
  'Glutes, thighs, hamstrings and calves': 'Glutes, thighs, hamstrings aur calves',
  'The one most people come here for': 'Zyadatar log isi ke liye aate hain',
  'Everything, lower body first': 'Sab kuch, lower body pehle',
  'Back, shoulders and arms — lighter': 'Back, shoulders aur arms — halka',
  'Glutes, thighs, lower body — or one muscle':
    'Glutes, thighs, lower body — ya ek muscle',
  'Bodyweight, a band, or one dumbbell':
    'Apna wazan, ek band, ya ek dumbbell',
  'Two lower-body days, one for thighs and calves, one upper, one core. The one most people want.':
    'Do din lower body, ek thighs aur calves, ek upper, ek core. Jo zyadatar log chahte hain.',
  'Three lower-body days against one upper. The easiest one to stick to.':
    'Teen din lower body, ek din upper. Isko nibhana sabse aasan hai.',
  'Everything below the waist, three times a week. Short on days, not on results.':
    'Kamar se neeche sab kuch, hafte mein teen baar. Din kam, natija poora.',
  'Everything, every session, lower body first. Best if you are new.':
    'Har session mein sab kuch, lower body pehle. Naye log isse shuru karein.',
  'Glutes, thighs, hamstrings, core, calves, arms. Twenty-five minutes each.':
    'Glutes, thighs, hamstrings, core, calves, arms. Har ek pachees minute.',

  /* ---------- period pain ---------- */
  'Menstrual Exercises': 'Period Ke Exercises',
  'Ten to twenty minutes for period pain': 'Period dard ke liye das se bees minute',
  'Ten to twenty minutes for period pain.': 'Period dard ke liye das se bees minute.',
  'Cramp Relief': 'Cramp Se Raahat',
  'For the worst day. All of it on the floor.':
    'Sabse bure din ke liye. Poora zameen pe.',
  'Lower Back & Hips': 'Kamar Aur Kulhe',
  'For the ache that sits in your back rather than your front.':
    'Jab dard aage nahi, peeche kamar mein baithta hai.',
  'Whole Body Ease': 'Poore Badan Ko Aaram',
  'For the heavy, bloated, worn-out days.':
    'Un dino ke liye jab badan bhaari aur thaka hua lage.',
  'Movement helps most ordinary period pain. It is not a treatment. Pain that stops your day, pain that is getting worse, or bleeding that soaks a pad in an hour is worth seeing a doctor about — that is not something to stretch through.':
    'Halki harkat aam period dard mein madad karti hai. Yeh ilaaj nahi hai. Agar dard itna hai ki din ruk jaata hai, ya badhta ja raha hai, ya ek ghante mein pad bhar jaata hai — toh doctor ko dikhao. Usse stretch se theek nahi kiya jaata.',
  'min': 'min',
  'Lower back': 'Kamar',
  'Hips': 'Kulhe',
  'Inner thigh': 'Andar ki jaangh',
  'Upper back': 'Upar ki kamar',
  'Ribs': 'Pasliyan',
  'Hold for': 'Itni der roko',
  'Go only as far as is comfortable and breathe out slowly into it. Nothing here should hurt — if it does, come out of it.':
    'Utna hi jao jitna aaram se ho jaye, aur dheere se saans chhodo. Yahan kuch bhi dard nahi karna chahiye — agar kare toh ruk jao.',
  'There is no rush and nothing to count. Move to the next one when you are ready.':
    'Koi jaldi nahi, kuch ginna nahi. Jab taiyaar ho tab agle pe jao.',

  /* ---------- the men/women switch ---------- */
  'You are in Women mode': 'Aap Women mode mein ho',
  'You are in Men mode': 'Aap Men mode mein ho',
  'Lower body focused — glutes, thighs and calves lead every session. Menstrual Exercises are on the Train screen. Switch back any time.':
    'Lower body pe focus — har session glutes, thighs aur calves se shuru hota hai. Period ke exercises Train screen pe hain. Jab chaho wapas badal lo.',
  'Upper body focused — push, pull and legs, the full gym library. Switch back any time.':
    'Upper body pe focus — push, pull aur legs, poori gym library. Jab chaho wapas badal lo.',

  /* ---------- the daily reminder ---------- */
  'Daily reminder': 'Roz ka reminder',
  'One line from a philosopher, once a day': 'Roz ek line, kisi philosopher ki',
  'Reminder time': 'Reminder ka time',
  'When should it arrive?': 'Kab aana chahiye?',
  'India time. One line from a philosopher, once a day.':
    'India ka time. Roz ek line, kisi philosopher ki.',
  'Could not change the time': 'Time badal nahi paaye',
  'One line a day?': 'Roz ek line?',
  'A philosopher, once a day, at six in the evening. Change the time or switch it off in Settings whenever you like.':
    'Roz shaam chhe baje ek line, kisi philosopher ki. Settings mein time badal sakte ho ya band kar sakte ho.',
  'Yes, remind me': 'Haan, yaad dilao',
  'Not now': 'Abhi nahi',
  'The floor, a chair, a band — nothing you need to buy':
    'Zameen, ek kursi, ek band — kuch khareedna nahi padega',
  'Nothing here needs a gym. A chair, a band, or one dumbbell — and a water can is a dumbbell.':
    'Yahan kisi cheez ke liye gym nahi chahiye. Ek kursi, ek band, ya ek dumbbell — aur paani ki can bhi dumbbell hai.',
  'Chair': 'Kursi',
  'Band': 'Band',
  'Bar': 'Bar',
  'Partner': 'Saathi',
  'Wheel': 'Wheel',
  'No equipment': 'Kuch nahi chahiye',
  'A chair': 'Ek kursi',
  'A band': 'Ek band',
  'A partner': 'Ek saathi',
  'Pull-up bar': 'Pull-up bar',
  'Ab wheel': 'Ab wheel',
  'Nothing here fits what you have to train with. Try the gym version, or pick another muscle.':
    'Jo aapke paas hai usse yeh nahi ho payega. Gym wala try karo, ya doosra muscle chuno.',
  'Could not add that': 'Yeh add nahi ho paaya',
  'Nothing was saved. Check your connection and try again.':
    'Kuch save nahi hua. Apna connection dekho aur phir se try karo.',
  'New here?': 'Naye ho?',
  'Create one': 'Ek banao',
  'Already have an account?': 'Account pehle se hai?',
};

const Ctx = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState('en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => { if (v === 'en' || v === 'hi') setLang(v); })
      .finally(() => setReady(true));
  }, []);

  const value = useMemo(() => ({
    lang,
    /* The whole point: t() takes English and hands back whichever
       language is on. Unknown strings come back untouched. */
    t: (s) => (lang === 'hi' && s != null && HI[s] !== undefined ? HI[s] : s),
    toggle: () => {
      const next = lang === 'hi' ? 'en' : 'hi';
      setLang(next);
      AsyncStorage.setItem(KEY, next).catch(() => {});
    },
  }), [lang]);

  if (!ready) return null;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang() {
  return useContext(Ctx) || { lang: 'en', t: (s) => s, toggle: () => {} };
}
