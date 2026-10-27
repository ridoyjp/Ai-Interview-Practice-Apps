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
const $=id=>document.getElementById(id);
let candidateName='',index=0,answers=Array(questions.length).fill(''),recognition=null,recording=false,micSession=0,recognitionBase='',recognitionFinal='',cameraStream=null;
const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
const QUESTION_SECONDS=60;
let remainingSeconds=QUESTION_SECONDS, countdownHandle=null, speechToken=0, selectedVoice=null;
function updateTimer(){const el=$('timer');if(!el)return;el.textContent=String(Math.floor(remainingSeconds/60)).padStart(2,'0')+':'+String(remainingSeconds%60).padStart(2,'0');el.classList.toggle('is-low',remainingSeconds<=10)}
function stopTimer(){if(countdownHandle!==null){clearInterval(countdownHandle);countdownHandle=null}}
function startTimer(){stopTimer();remainingSeconds=QUESTION_SECONDS;updateTimer();let deadline=Date.now()+QUESTION_SECONDS*1000;countdownHandle=setInterval(()=>{if($('practice').hidden){stopTimer();return}remainingSeconds=Math.max(0,Math.ceil((deadline-Date.now())/1000));updateTimer();if(remainingSeconds===0){stopTimer();advanceQuestion(true)}},250)}
function chooseJapaneseVoice(){if(!('speechSynthesis' in window))return null;const voices=speechSynthesis.getVoices();return voices.find(v=>v.lang.toLowerCase()==='ja-jp'&&v.localService)||voices.find(v=>v.lang.toLowerCase().startsWith('ja'))||null}
if('speechSynthesis' in window){selectedVoice=chooseJapaneseVoice();speechSynthesis.addEventListener?.('voiceschanged',()=>{selectedVoice=chooseJapaneseVoice()})}

function micLabel(){ $('mic').textContent=recording?'■ マイク OFF':'🎤 マイク ON';$('mic').setAttribute('aria-pressed',String(recording));}
function stopMic(){recording=false;micSession++;const r=recognition;recognition=null;if(r){try{r.abort()}catch(e){}}micLabel()}
function startRecognition(session){
 if(!recording||session!==micSession||!SpeechRecognition)return;
 const r=new SpeechRecognition();recognition=r;r.lang='ja-JP';r.continuous=true;r.interimResults=true;
 recognitionBase=$('answer').value.trim();recognitionFinal='';
 r.onresult=e=>{if(!recording||session!==micSession||recognition!==r)return;let interim='';for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0].transcript;if(e.results[i].isFinal)recognitionFinal+=(recognitionFinal?' ':'')+t;else interim+=t} $('answer').value=[recognitionBase,recognitionFinal,interim].filter(Boolean).join(' ');answers[index]=$('answer').value};
 r.onerror=e=>{if(session!==micSession)return;if(['not-allowed','service-not-allowed','audio-capture'].includes(e.error)){stopMic();$('status').textContent='マイクを使用できません。許可を確認するか、文字で回答してください。'}else if(e.error!=='aborted'){$('status').textContent='音声入力を再接続しています…'}};
 r.onend=()=>{if(recognition!==r||session!==micSession)return;recognition=null;if(recording){const saved=$('answer').value.trim();answers[index]=saved;setTimeout(()=>{if(recording&&session===micSession)startRecognition(session)},250)}};
 try{r.start();$('status').textContent='🎤 マイクON：OFFを押すまで音声入力を続けます。'}catch(e){stopMic();$('status').textContent='マイクを起動できません。文字で入力してください。'}
}
function toggleMic(){if(recording){stopMic();$('status').textContent='マイクをOFFにしました。';return}if(!SpeechRecognition){$('status').textContent='このブラウザは音声入力に対応していません。文字で入力してください。';return}recording=true;micSession++;micLabel();startRecognition(micSession)}
function stopVoice(){speechToken++;if('speechSynthesis' in window)speechSynthesis.cancel()}
function speak(){
 stopVoice();
 if(!('speechSynthesis' in window)){$('status').textContent='このブラウザは質問の音声読み上げに対応していません。';return}
 const token=speechToken;
 const utterance=new SpeechSynthesisUtterance(questions[index]);
 utterance.lang='ja-JP';utterance.rate=0.88;utterance.pitch=1;utterance.volume=1;
 selectedVoice=chooseJapaneseVoice();if(selectedVoice)utterance.voice=selectedVoice;
 utterance.onstart=()=>{if(token===speechToken)$('status').textContent='🔊 AI面接官が質問を読み上げています。'};
 utterance.onend=()=>{if(token===speechToken)$('status').textContent='回答を入力してください。時間が終了すると自動で次へ進みます。'};
 utterance.onerror=e=>{if(token!==speechToken||e.error==='canceled'||e.error==='interrupted')return;$('status').textContent='音声を再生できません。端末の音量と日本語音声の設定を確認し、「質問を聞く」を押してください。'};
 try{speechSynthesis.resume();speechSynthesis.speak(utterance)}catch(e){$('status').textContent='音声再生に失敗しました。ブラウザの音声設定をご確認ください。'}
}
function showQuestion(){stopVoice();$('count').textContent=`質問 ${index+1} / ${questions.length}`;$('bar').style.width=`${(index+1)/questions.length*100}%`;$('question').textContent=questions[index];$('answer').value=answers[index];$('next').textContent=index===questions.length-1?'回答を確認 →':'次の質問 →';$('status').textContent=recording?'🎤 マイクON：音声入力を続けています。':'60秒以内に回答してください。時間終了で自動的に次へ進みます。';startTimer()}
$('start').onclick=()=>{const name=$('candidateName').value.trim();if(!name){$('nameError').hidden=false;$('candidateName').focus();return}candidateName=name;$('nameError').hidden=true;$('candidateLabel').textContent=name+' さん';$('welcome').hidden=true;$('practice').hidden=false;showQuestion();speak()};
$('candidateName').addEventListener('input',()=>{$('nameError').hidden=!!$('candidateName').value.trim()});$('candidateName').addEventListener('keydown',e=>{if(e.key==='Enter')$('start').click()});
$('speak').onclick=speak;
$('mic').onclick=toggleMic;
async function toggleCamera(){if(cameraStream){stopCamera();return}if(!navigator.mediaDevices?.getUserMedia){$('status').textContent='このブラウザではカメラを使えません。';return}try{cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false});$('cameraPreview').srcObject=cameraStream;$('cameraPreview').hidden=false;$('camera').textContent='📷 カメラ OFF';$('camera').setAttribute('aria-pressed','true')}catch(e){$('status').textContent='カメラを利用できません。ブラウザの許可を確認してください。'}}
function stopCamera(){if(cameraStream){cameraStream.getTracks().forEach(t=>t.stop());cameraStream=null}$('cameraPreview').srcObject=null;$('cameraPreview').hidden=true;$('camera').textContent='📷 カメラ ON';$('camera').setAttribute('aria-pressed','false')}
$('camera').onclick=toggleCamera;
function switchQuestion(){if(recording){const r=recognition;recognition=null;if(r)try{r.abort()}catch(e){};if(recording)startRecognition(micSession)}}
$('answer').oninput=()=>{answers[index]=$('answer').value};
function advanceQuestion(automatic=false){
 answers[index]=$('answer').value.trim();stopTimer();stopVoice();
 if(index<questions.length-1){index++;showQuestion();switchQuestion();speak()}
 else{stopMic();stopCamera();showResults()}
}
$('next').onclick=()=>advanceQuestion(false);
function showResults(){stopTimer();stopVoice();$('resultName').textContent='お名前：'+candidateName;$('practice').hidden=true;$('finish').hidden=false;$('results').replaceChildren();questions.forEach((q,i)=>{const div=document.createElement('div');div.className='result';const title=document.createElement('strong');title.textContent=`${i+1}. ${q}`;const p=document.createElement('p');p.textContent=answers[i]||'（回答なし）';div.append(title,p);$('results').append(div)})}
$('download').onclick=()=>{const text='お名前：'+candidateName+'\n\n'+questions.map((q,i)=>`${i+1}. ${q}\n${answers[i]||'（回答なし）'}`).join('\n\n');const url=URL.createObjectURL(new Blob(['\ufeff'+text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='面接練習_回答.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
function returnHome(){stopTimer();stopMic();stopCamera();stopVoice();index=0;answers=Array(questions.length).fill('');$('finish').hidden=true;$('practice').hidden=true;$('welcome').hidden=false;$('candidateName').value='';$('nameError').hidden=true;candidateName='';}
$('quit').onclick=returnHome;
$('finishEarly').onclick=()=>{stopTimer();answers[index]=$('answer').value.trim();stopMic();stopCamera();stopVoice();showResults()};
$('again').onclick=returnHome;
window.addEventListener('beforeunload',()=>{stopTimer();stopMic();stopCamera();stopVoice()});
