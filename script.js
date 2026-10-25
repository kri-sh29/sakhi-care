const $=s=>document.querySelector(s);
const STEPS=["Concern","Symptoms","Summary","Learn","Voice Card","Care Card","Diary","Privacy","Ask Sakhi"];
let step=0,S={concern:"",dur:"",freq:"",sev:5,syms:[],notes:"",lang:"en",voice:""};
let chatMessages=[],chatBusy=false;
async function loadAI(){S.ai=null;S.aiState="loading";render();try{S.ai=await getAISummary({concern:S.concern,symptoms:S.syms,duration:S.dur||"not specified",frequency:S.freq||"not specified",severity:S.sev,notes:""});S.aiState="ok"}catch(e){console.error(e);S.aiState="fail"}render()}
const store={get(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
const C={
 period:{name:"Menstrual health concern",syms:["Irregular cycles","Missed period","Very heavy bleeding","Very painful cramps","Spotting between periods","Cycle shorter than 21 days","Cycle longer than 38 days","Fatigue","Mood changes"],urgent:["Very heavy bleeding"],
  learn:{en:["A typical cycle is about 21–38 days, counted from the first day of one period to the first day of the next.","Cycles can vary after puberty, with stress, weight change, illness or sleep changes. Irregular does not always mean something serious, but a doctor should check patterns that persist.","“Amenorrhoea” means missed periods. “Menorrhagia” means unusually heavy bleeding."],hi:["Ek normal cycle lagbhag 21–38 din ka hota hai (ek period ke pehle din se agle period ke pehle din tak).","Stress, weight change, bimari ya neend ki kami se cycle badal sakta hai. Agar yeh baar-baar ho, to doctor ko dikhana accha hai.","“Amenorrhoea” ka matlab period miss hona; “Menorrhagia” ka matlab bahut zyada bleeding."]},
  q:["Could my cycle pattern need any tests (for example blood tests or an ultrasound)?","Are my symptoms related to hormones, thyroid, iron levels or something else?","How much bleeding is too much for me?","What can I track so you can see a clearer pattern?"]},
 pcos:{name:"PCOS / PMOS-related concern",syms:["Irregular periods","Acne","Excess facial or body hair","Hair thinning","Weight gain","Dark patches on skin","Difficulty conceiving","Fatigue"],urgent:[],
  learn:{en:["PCOS (polycystic ovary syndrome) was officially renamed PMOS (polyendocrine metabolic ovarian syndrome) in May 2026. It is the same condition under a new name, and both names are still in use. It is a common hormonal and metabolic condition, diagnosed by a doctor using history, examination and tests — not by symptoms alone.","Signs that may prompt a check include irregular periods, acne, extra hair growth and hair thinning.","Treatment plans are individual and often involve lifestyle support and, when needed, medicines."],hi:["PCOS ka naam May 2026 mein official taur par PMOS (polyendocrine metabolic ovarian syndrome) kar diya gaya hai — yeh wahi condition hai. Yeh ek common hormonal aur metabolic condition hai. Iska nidaan doctor history, jaanch aur tests se karte hain — sirf symptoms se nahi.","Irregular period, pimples, zyada baal ya baal jhadna jaise lakshan doctor se milne ki wajah ho sakte hain.","Ilaaj har vyakti ke liye alag hota hai."]},
  q:["Do my symptoms suggest I should have hormone or blood-sugar tests?","Is an ultrasound useful in my case?","What lifestyle changes would help me most?","How could this affect future pregnancy planning?"]},
 breast:{name:"Breast change concern",syms:["New lump","Lump that feels hard or fixed","Skin dimpling or redness","Nipple discharge","Nipple turning inward (new)","Breast pain","Swelling in armpit","Change in size or shape"],urgent:["New lump","Lump that feels hard or fixed","Skin dimpling or redness","Nipple discharge","Nipple turning inward (new)","Swelling in armpit","Change in size or shape"],
  learn:{en:["WHO notes that as many as 90% of breast masses are not cancerous, but any new lump, skin change, nipple discharge or lasting change should be examined by a healthcare professional.","Breast pain on its own is common and often linked to hormones, but should still be mentioned to your doctor if persistent.","Only a clinical examination and tests such as ultrasound or mammography can assess a breast change."],hi:["WHO ke anusaar lagbhag 90% breast ganth cancer nahi hoti, lekin koi bhi nayi ganth, skin change ya discharge ho to doctor se zaroor milein.","Sirf dard aam hai, par agar lagataar ho to doctor ko batayein.","Jaanch sirf doctor ki examination aur ultrasound/mammography se hoti hai."]},
  q:["Does this change need an ultrasound or mammogram?","How often should I have a clinical breast examination?","What changes should make me return sooner?","Is there anything in my family history I should mention?"]}
};
const SRC={period:[["UCLA Health – What you need to know about irregular periods","https://www.uclahealth.org/news/article/what-you-need-know-about-irregular-periods"],["UNMC Ob/Gyn – Understanding the menstrual cycle (cites ACOG)","https://unmc.edu/obgyn/_documents/may_2024_unmc_bb_-_understanding_the_menstrual_cycle_handout.pdf"]],pcos:[["Health Translations (Victoria, AU) – PCOS fact sheet","https://healthtranslations.vic.gov.au/resources/polycystic-ovary-syndrome"],["Endometriosis UK – PCOS officially renamed PMOS","https://www.endometriosis-uk.org/news/pcos-officially-renamed-polyendocrine-metabolic-ovarian-syndrome-pmos"]],breast:[["WHO EMRO – Breast cancer awareness: symptoms and early detection","https://www.emro.who.int/noncommunicable-diseases/campaigns/breast-cancer-month-2021.html"]]};
const URG=["Soaking a pad or tampon every hour","Fainting or severe dizziness","Severe one-sided pelvic pain","Possible pregnancy with pain or bleeding"];
function today(){return new Date().toISOString().slice(0,10)}
function esc(t){return String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function urgentFlag(){if(!S.concern)return false;const c=C[S.concern];return S.syms.some(s=>c.urgent.includes(s)||URG.includes(s))||S.sev>=9||!!(S.ai&&S.ai.urgent)}
function urgentBox(){return urgentFlag()?`<div class="urgent">⚠️ Some of what you reported can need prompt professional assessment. Please contact a doctor or clinic soon (same day for heavy bleeding, fainting or severe pain). If you feel unsafe, go to the nearest emergency service.</div>`:""}
function nav(){$("#nav").innerHTML=STEPS.map((s,i)=>`<button class="${i==step?'on':''}" onclick="go(${i})">${i+1}. ${s}</button>`).join("")}
function go(i){if(i>0&&i<6&&!S.concern){alert("Please choose a concern first.");i=0}step=i;render();window.scrollTo(0,0);if(i==2&&(S.syms.length||S.dur))loadAI()}
function render(){nav();const f=[vConcern,vSym,vSum,vLearn,vVoice,vCare,vDiary,vPriv,vChat][step];$("#view").innerHTML=f()}
function nextBtn(){return `<button class="btn" onclick="go(${step+1})">Continue →</button>`}
function vConcern(){return `<div class="card"><h2>What would you like help with?</h2><p class="small">Understand → Track → Express → Take Action</p><div class="opt">${Object.keys(C).map(k=>`<button onclick="pick('${k}')">${k=='period'?'🩸':k=='pcos'?'🌿':'🎀'} <b>${C[k].name}</b></button>`).join("")}</div></div>`}
function pick(k){if(S.concern!==k)S.syms=[];S.concern=k;go(1)}
function vSym(){const c=C[S.concern];const sel=(id,opts,v)=>`<select id="${id}" onchange="S.${id}=this.value"><option value="">Select…</option>${opts.map(o=>`<option ${o==v?'selected':''}>${o}</option>`).join("")}</select>`;
return `<div class="card"><h2>${c.name}</h2><label>What are you noticing?</label><div class="chk">${c.syms.map(s=>`<label><input type="checkbox" ${S.syms.includes(s)?'checked':''} onchange="tg('${s.replace(/'/g,"\\'")}',this.checked)"> ${s}</label>`).join("")}</div>
<label>How long has this been happening?</label>${sel("dur",["Less than 1 week","1–4 weeks","1–3 months","3–6 months","More than 6 months"],S.dur)}
<label>How often?</label>${sel("freq",["Once","Occasionally","Most cycles / weeks","Almost every day","Constant"],S.freq)}
<label>Severity: <span id="sv">${S.sev}</span>/10</label><input type="range" min="1" max="10" value="${S.sev}" oninput="S.sev=+this.value;$('#sv').textContent=this.value">
<label>Anything else? (optional)</label><textarea maxlength="600" oninput="S.notes=this.value">${esc(S.notes)}</textarea>
<p class="small">Also seek care urgently for: ${URG.join("; ")}.</p>
<label style="display:flex;gap:8px;align-items:center;font-weight:400"><input type="checkbox" style="width:auto" onchange="tg('${URG[0]}',this.checked)"> ${URG[0]}</label>
<label style="display:flex;gap:8px;align-items:center;font-weight:400"><input type="checkbox" style="width:auto" onchange="tg('${URG[1]}',this.checked)"> ${URG[1]}</label>
${nextBtn()}</div>`}
function tg(s,on){S.syms=S.syms.filter(x=>x!==s);if(on)S.syms.push(s)}
function vSum(){if(!S.syms.length&&!S.dur){return `<div class="card"><p>Please fill in at least one symptom or duration first.</p><button class="btn" onclick="go(1)">← Back</button></div>`}
const c=C[S.concern];const sevw=S.sev<=3?"mild":S.sev<=6?"moderate":"severe";
return `<div class="card"><h2>Your concern, in plain words</h2>${urgentBox()}
<p>You told us about a <b>${c.name.toLowerCase()}</b>. You are noticing: <b>${S.syms.length?S.syms.join(", "):"no specific symptoms selected"}</b>. This has been going on for <b>${S.dur||"an unspecified time"}</b>, happening <b>${S.freq?S.freq.toLowerCase():"at an unspecified frequency"}</b>, and you rated it <b>${S.sev}/10 (${sevw})</b>.${S.notes?` You added: “${esc(S.notes)}”.`:""}</p>
${S.aiState=="loading"?'<p class="small">✨ Generating AI-assisted summary…</p>':""}${S.ai?`<h3>${S.ai.source&&S.ai.source!=="template"?"✨ AI-assisted summary ("+esc(S.ai.source)+")":"Template summary (no AI key set on the server)"}</h3><p>${esc(S.ai.summary)}</p><p class="small">${esc(S.ai.disclaimer||"")}</p>`:""}${S.aiState=="fail"?'<p class="small">AI service unavailable — showing the standard summary above.</p>':""}<p class="small">This summary only restates what you entered. It is not a diagnosis.</p>
<h3>Questions you could ask a doctor</h3><ul>${(S.ai&&S.ai.questions_for_doctor&&S.ai.questions_for_doctor.length?S.ai.questions_for_doctor:c.q).map(q=>`<li>${esc(q)}</li>`).join("")}</ul>
<h3>General next step</h3><p>${urgentFlag()?"Book a consultation soon and bring your Care Card.":"Keep tracking for a few weeks and book a routine consultation if this continues or worries you."}</p>
<button class="btn s" onclick="saveDiary()">+ Save to my diary</button>${nextBtn()}</div>`}
function vLearn(){const c=C[S.concern];return `<div class="card"><h2>Health Sikho 📖</h2><div class="noprint"><button class="btn ${S.lang=='en'?'':'s'}" onclick="S.lang='en';render()">English</button><button class="btn ${S.lang=='hi'?'':'s'}" onclick="S.lang='hi';render()">Hinglish</button><button class="btn s" onclick="speak()">🔊 Listen</button></div><ul id="lt">${c.learn[S.lang].map(t=>`<li>${t}</li>`).join("")}</ul>
${S.concern=='breast'?`<div class="warn"><b>Experimental education demo:</b> your team’s breast model can be linked here. It is <b>not</b> a diagnosis or a reliable personal risk estimate. Only a healthcare professional can assess breast symptoms.</div>`:""}
<h3>Sources &amp; further reading</h3><ul class="small">${SRC[S.concern].map(s=>`<li><a href="${s[1]}" target="_blank" rel="noopener noreferrer" style="color:var(--pr)">${s[0]}</a></li>`).join("")}</ul><p class="small">Summarised in simple language from these sources (checked 24 Oct 2026). Always confirm with a healthcare professional.</p>
${nextBtn()}</div>`}
function speak(){try{const u=new SpeechSynthesisUtterance($("#lt").innerText);u.lang=S.lang=='hi'?'hi-IN':'en-IN';speechSynthesis.cancel();speechSynthesis.speak(u)}catch(e){alert("Audio is not supported on this device.")}}
function draftVoice(to){const n=C[S.concern].name.toLowerCase(),sy=S.syms.slice(0,3).join(", ").toLowerCase();
const en=to=="doctor"?`Hello, I have noticed changes related to a ${n}${sy?` (${sy})`:""} for ${S.dur?S.dur.toLowerCase():"some time"}. I would like to understand what is happening. Could you help me arrange a consultation?`:`I have been having a health concern (${n}) and I would like some support. Could you please come with me to see a doctor, and keep this between us?`;
const hi=to=="doctor"?`Namaste, mujhe ${n} se jude kuch badlav ${S.dur?`(${S.dur.toLowerCase()} se) `:""}dikh rahe hain. Main samajhna chahti hoon ki kya ho raha hai. Kya aap consultation arrange karne mein madad karenge?`:`Mujhe ek health concern hai aur mujhe support chahiye. Kya aap mere saath doctor ke paas chalenge? Kripya yeh baat humare beech rahe.`;
S.voice=S.lang=='hi'?hi:(to=="doctor"&&S.ai&&S.ai.voice_card?S.ai.voice_card:en);render()}
function vVoice(){return `<div class="card"><h2>My Voice Card 💬</h2><p class="small">Pick who it is for, then edit it in your own words.</p>
<button class="btn" onclick="draftVoice('doctor')">For a doctor</button><button class="btn s" onclick="draftVoice('trusted')">For a trusted person</button>
<label>Your message (editable)</label><textarea id="vc" oninput="S.voice=this.value">${esc(S.voice)}</textarea>
<button class="btn s" onclick="navigator.clipboard&&navigator.clipboard.writeText($('#vc').value).then(()=>alert('Copied'),()=>alert('Select the text and copy it manually.'))">📋 Copy</button>${nextBtn()}</div>`}
function vCare(){const c=C[S.concern];const d=store.get("diary")||[];
return `<div class="card"><h2>Doctor-Ready Care Card 🩺</h2><p class="small">Prepared on ${today()} · Created by SakhiCare (education tool, not a diagnosis)</p>${urgentBox()}
<div class="row"><b>Main concern</b><span>${c.name}</span></div><div class="row"><b>Symptoms</b><span>${S.syms.join(", ")||"—"}</span></div>
<div class="row"><b>Duration</b><span>${S.dur||"—"}</span></div><div class="row"><b>Frequency</b><span>${S.freq||"—"}</span></div><div class="row"><b>Severity</b><span>${S.sev}/10</span></div>${S.notes?`<div class="row"><b>Notes</b><span>${esc(S.notes)}</span></div>`:""}
<h3>Symptom history</h3>${d.length?d.map(e=>`<div class="row"><span>${e.date} · ${esc(e.concern)}</span><span>${esc(e.syms)} · ${e.sev}/10</span></div>`).join(""):'<p class="small">No diary entries saved yet.</p>'}
<h3>Questions to discuss</h3><ul>${c.q.map(q=>`<li>${q}</li>`).join("")}</ul>${S.voice?`<h3>My message</h3><p>${esc(S.voice)}</p>`:""}
<h3>General next step</h3><p>${urgentFlag()?"Seek professional care soon.":"Book a routine consultation and bring this card."}</p>
<button class="btn noprint" onclick="window.print()">🖨️ Print / Save as PDF</button></div>`}
function saveDiary(){const d=store.get("diary")||[];d.push({date:today(),concern:C[S.concern].name,syms:S.syms.join(", ")||"—",sev:S.sev,note:S.notes});if(store.set("diary",d))alert("Saved on this device.");else alert("Could not save (browser storage unavailable).")}
function vDiary(){const d=store.get("diary")||[];return `<div class="card"><h2>Privacy-First Diary 📅</h2>${d.length?`<div class="tl">${d.map((e,i)=>`<div class="row"><span><b>${e.date}</b> · ${esc(e.concern)}<br><span class="small">${esc(e.syms)}</span></span><span>${e.sev}/10 <button class="btn s noprint" style="padding:2px 8px;margin:0" onclick="delEntry(${i})">✕</button></span></div>`).join("")}</div>
<h3>Severity timeline</h3><svg viewBox="0 0 300 80" width="100%" role="img" aria-label="Severity over time"><polyline fill="none" stroke="var(--pr)" stroke-width="2" points="${d.map((e,i)=>`${d.length>1?10+i*280/(d.length-1):150},${75-e.sev*7}`).join(" ")}"/>${d.map((e,i)=>`<circle r="3.5" fill="var(--pr)" cx="${d.length>1?10+i*280/(d.length-1):150}" cy="${75-e.sev*7}"/>`).join("")}</svg>`:'<p>No entries yet. Generate a summary and tap “Save to my diary”.</p>'}
<div class="noprint"><button class="btn" onclick="go(5)">View Care Card</button></div></div>`}
function delEntry(i){const d=store.get("diary")||[];d.splice(i,1);store.set("diary",d);render()}
function vPriv(){return `<div class="card"><h2>Privacy &amp; safety 🔒</h2><ul><li>Diary entries are stored in this browser. When you request an AI summary or use Ask Sakhi, the information you submit is sent to the configured backend and external AI provider to generate a response. Avoid entering identifying details.</li><li>You choose what to save and what to print or share.</li><li>This tool is for education and consultation preparation, not diagnosis or treatment.</li><li>In an emergency, contact local emergency services or go to the nearest hospital.</li></ul>
<button class="btn" style="background:#b71c1c" onclick="if(confirm('Delete ALL saved diary data and current answers?')){store.del('diary');S={concern:'',dur:'',freq:'',sev:5,syms:[],notes:'',lang:'en',voice:''};go(0)}">🗑️ Delete all my data</button></div>`}
function vChat(){
const bubbles=chatMessages.map(m=>`<div class="chat-msg ${m.role==='user'?'user':'bot'}"><b>${m.role==='user'?'You':'🌸 Ask Sakhi'}</b><div>${esc(m.text).replace(/\n/g,'<br>')}</div></div>`).join("");
return `<div class="card chat-card"><h2>Ask Sakhi 🌸</h2><p class="small">Ask general women’s-health questions or discuss common symptoms. Hindi, Hinglish and English are welcome.</p>
<div class="warn">Health education only — not a diagnosis or a substitute for medical care. Please don’t share your name, phone number, address or other identifying details.</div>
<div class="chat-suggestions"><button class="btn s" onclick="useChatPrompt('What are common symptoms of PCOS?')">PCOS basics</button><button class="btn s" onclick="useChatPrompt('What should I track when my periods are irregular?')">Irregular periods</button><button class="btn s" onclick="useChatPrompt('What questions can I ask my doctor about breast changes?')">Doctor questions</button></div>
<div id="chat-log" class="chat-log" aria-live="polite">${bubbles||'<p class="small chat-empty">Hi, I’m Ask Sakhi. What would you like to understand today?</p>'}${chatBusy?'<div class="chat-msg bot"><b>🌸 Ask Sakhi</b><div>Thinking…</div></div>':''}</div>
<form class="chat-form" onsubmit="event.preventDefault();sendChat()"><label for="chat-input">Your question</label><textarea id="chat-input" maxlength="1000" rows="2" placeholder="Type your question here…" required ${chatBusy?'disabled':''}></textarea><button class="btn" type="submit" ${chatBusy?'disabled':''}>${chatBusy?'Please wait…':'Send message →'}</button><button class="btn s" type="button" onclick="clearChat()">Clear chat</button></form>
<p class="small">If symptoms are severe, worsening, or feel urgent, seek medical care rather than relying on a chatbot.</p></div>`;
}
function useChatPrompt(text){const input=$("#chat-input");if(input){input.value=text;input.focus()}}
function clearChat(){if(chatBusy)return;chatMessages=[];render()}
async function sendChat(){
 const input=$("#chat-input");if(!input||chatBusy)return;
 const message=input.value.trim();if(!message)return;
 const history=chatMessages.slice(-8).map(m=>({role:m.role,text:m.text}));
 chatMessages.push({role:"user",text:message});chatBusy=true;render();
 try{
   const result=await sendChatMessage(message,history);
   chatMessages.push({role:"model",text:result.reply||"I couldn’t prepare a reply. Please try again."});
 }catch(error){
   chatMessages.push({role:"model",text:error.message||"Ask Sakhi is temporarily unavailable. Please try again."});
 }finally{chatBusy=false;render();const log=$("#chat-log");if(log)log.scrollTop=log.scrollHeight;const next=$("#chat-input");if(next)next.focus();}
}
render();
