
const questions=[
'自己紹介をお願いします。',
'これまでの経験の中で、最も力を入れて取り組んだことを教えてください。',
'あなたの強みと弱みを教えてください。',
'当社を志望する理由を教えてください。',
'入社後に挑戦したいこと、実現したいことは何ですか。',
'仕事において大切にしている価値観を教えてください。',
'チームで成果を出した経験を教えてください。',
'困難な状況をどのように乗り越えたか、具体的なエピソードを教えてください。',
'これまでに身につけたスキルや経験で、当社で活かせるものは何ですか。',
'目標を達成するために工夫したことを教えてください。',
'周囲からはどのような人だと言われることが多いですか。',
'仕事を選ぶうえで重視している条件を教えてください。',
'5年後、どのような姿になっていたいですか。',
'ストレスやプレッシャーへの対処法を教えてください。',
'最後に、何か質問や伝えておきたいことがあればお願いします。'
];
const $=id=>document.getElementById(id);let index=0,answers=Array(15).fill(''),remaining=60,tick=null,recognition=null,listening=false,stream=null,finalText='',interimText='',speaking=false;
const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
function message(s){$('notice').textContent=s}
function stopClock(){clearInterval(tick);tick=null}
function updateClock(){$('timer').textContent=`残り：${remaining}秒`;$('timer').classList.toggle('low',remaining<=10)}
// Cross-device Japanese text-to-speech: starts from a user gesture and retains
// the utterance to avoid premature garbage collection in mobile browsers.
let activeUtterance=null, voiceList=[], voiceToken=0;
function refreshVoices(){if('speechSynthesis' in window) voiceList=window.speechSynthesis.getVoices()||[]}
if('speechSynthesis' in window){refreshVoices();window.speechSynthesis.addEventListener?.('voiceschanged',refreshVoices)}
function stopSpeech(){voiceToken++;if('speechSynthesis' in window)window.speechSynthesis.cancel();activeUtterance=null;speaking=false;$('avatar').classList.remove('speaking');$('avatarState').textContent='AI Interviewer'}
function speak(){
  if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window)){
    message('この端末では音声読み上げを利用できません。質問を画面でご確認ください。');return;
  }
  stopSpeech();const token=voiceToken;refreshVoices();
  const u=new SpeechSynthesisUtterance(questions[index]);activeUtterance=u;
  u.lang='ja-JP';u.rate=.88;u.pitch=1;u.volume=1;
  const japanese=voiceList.filter(v=>/^ja(?:-|_)/i.test(v.lang));
  if(japanese.length)u.voice=japanese.find(v=>v.localService)||japanese[0];
  u.onstart=()=>{if(token!==voiceToken)return;speaking=true;$('avatar').classList.add('speaking');$('avatarState').textContent='質問を読み上げています';$('soundHelp').hidden=true};
  const done=()=>{if(token!==voiceToken)return;speaking=false;$('avatar').classList.remove('speaking');$('avatarState').textContent='AI Interviewer';activeUtterance=null};
  u.onend=()=>{done();if(token===voiceToken && !$('interview').classList.contains('hidden'))begin()};u.onerror=e=>{done();$('soundHelp').hidden=false;message('音声を再生できません。🔊「音声を再生」を押してください。')};
  try{window.speechSynthesis.speak(u);window.speechSynthesis.resume();}catch(e){done();$('soundHelp').hidden=false}
  // Some mobile engines silently block background speech; provide manual replay.
  $('soundHelp').hidden=false;
}
function stopListening(){listening=false;if(recognition){try{recognition.stop()}catch(e){}}$('micStatus').textContent='⚪ マイク待機中'}
function startClock(){stopClock();tick=setInterval(()=>{remaining=Math.max(0,remaining-1);updateClock();if(remaining===0){save();stopClock();stopListening();if($('autoNext').checked)nextQuestion();else message('時間終了です。「次の質問へ」を押してください。')}},1000)}
function showQuestion(){stopClock();stopListening();stopSpeech();remaining=Number($('duration').value);updateClock();$('counter').textContent=`質問 ${index+1} / ${questions.length}`;$('question').textContent=questions[index];$('answer').value=answers[index];finalText=answers[index];interimText='';$('next').textContent=index===questions.length-1?'結果を見る →':'次の質問へ →';startClock();}
function begin(){if(listening)return;listening=true;$('micStatus').textContent='🟢 マイク認識';if(Recognition){recognition=new Recognition();recognition.lang='ja-JP';recognition.continuous=true;recognition.interimResults=true;recognition.onresult=e=>{let interim='';for(let i=e.resultIndex;i<e.results.length;i++){let part=e.results[i][0].transcript;if(e.results[i].isFinal)finalText+=(finalText?' ':'')+part;else interim+=part}interimText=interim;$('answer').value=finalText+(interim?' '+interim:'')};recognition.onerror=e=>{message('音声認識: '+e.error+'。必要なら回答欄に直接入力してください。');if(e.error==='not-allowed'||e.error==='service-not-allowed')stopListening()};const thisRecognition=recognition;recognition.onend=()=>{if(listening && recognition===thisRecognition){try{thisRecognition.start()}catch(e){}}};try{recognition.start()}catch(e){message('マイクを起動できませんでした。手入力できます。')}}else{message('このブラウザは音声認識に対応していません。Chromeで試すか手入力してください。')}
}
function save(){answers[index]=$('answer').value.trim();finalText=answers[index]}
function nextQuestion(){save();stopClock();stopListening();stopSpeech();if(index<questions.length-1){index++;showQuestion();speak()}else showResults()}
function showResults(){stopClock();$('interview').classList.add('hidden');$('results').classList.remove('hidden');$('resultList').replaceChildren();questions.forEach((q,i)=>{let div=document.createElement('div');div.className='result-item';let h=document.createElement('h3');h.textContent=`${i+1}. ${q}`;let p=document.createElement('p');p.textContent=answers[i]||'（回答なし）';div.append(h,p);$('resultList').append(div)})}
$('repeat').onclick=speak;$('soundHelp').onclick=speak;$('next').onclick=nextQuestion;$('answer').addEventListener('input',()=>{finalText=$('answer').value;answers[index]=finalText});$('duration').onchange=()=>{remaining=Number($('duration').value);updateClock();startClock()};
$('cameraQuick').onclick=()=> $('cameraBtn').click();$('cameraBtn').onclick=async()=>{if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;$('camera').srcObject=null;$('cameraBtn').textContent='📷 カメラをオン';return}try{stream=await navigator.mediaDevices.getUserMedia({video:true,audio:false});$('camera').srcObject=stream;$('cameraBtn').textContent='📷 カメラをオフ'}catch(e){message('カメラにアクセスできません。HTTPS または localhost で開き、カメラを許可してください。')}};
$('export').onclick=()=>{let content=questions.map((q,i)=>`${i+1}. ${q}\n${answers[i]||'（回答なし）'}`).join('\n\n');let blob=new Blob(['\ufeff'+content],{type:'text/plain;charset=utf-8'});let url=URL.createObjectURL(blob);let a=document.createElement('a');a.href=url;a.download='interview-answers.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
$('restart').onclick=()=>{index=0;answers=Array(15).fill('');$('results').classList.add('hidden');$('interview').classList.remove('hidden');showQuestion();speak()};window.addEventListener('beforeunload',()=>{stopSpeech();if(stream)stream.getTracks().forEach(t=>t.stop())});
$('launch').onclick=()=>{const name=$('candidateName').value.trim();if(!name){$('introError').textContent='お名前を入力してください。';$('candidateName').focus();return}if(!$('consent').checked){$('introError').textContent='同意のチェックを入れてください。';return}$('introError').textContent='';$('intro').classList.add('hidden');$('interview').classList.remove('hidden');showQuestion();speak();$('cameraBtn').click();};
