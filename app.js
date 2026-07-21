let localActiveQuestion = "";
let localStream = null;

// Clean adaptive cloud endpoint mapping
const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
    ? "http://127.0.0.1:8000" 
    : "";

function showLoader(msg) {
    document.getElementById("loadingMsg").innerText = msg;
    document.getElementById("loadingOverlay").classList.remove("hidden");
}
function hideLoader() {
    document.getElementById("loadingOverlay").classList.add("hidden");
}

document.getElementById("demoBtn").addEventListener("click", () => {
    document.getElementById("ocrBox").value = "The Law of Reflection states that the angle of incidence is equal to the angle of reflection. When light rays strike a smooth surface, they bounce back safely into the same medium.";
});

document.getElementById("toggleCamBtn").addEventListener("click", async () => {
    const video = document.getElementById("webcam");
    const placeholder = document.getElementById("cameraPlaceholder");
    const btn = document.getElementById("toggleCamBtn");

    if (!localStream) {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = localStream;
            video.classList.remove("hidden");
            placeholder.classList.add("hidden");
            btn.innerText = "📸 Capture Textbook Page";
        } catch (err) {
            alert("Camera feature requires a secure HTTPS production environment deployment link to function.");
        }
    } else {
        document.getElementById("demoBtn").click();
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
        video.classList.add("hidden");
        placeholder.classList.remove("hidden");
        btn.innerText = "Start Camera Stream";
    }
});

document.getElementById("submitTextBtn").addEventListener("click", async () => {
    const rawText = document.getElementById("ocrBox").value.trim();
    const currentLang = document.getElementById("lang").value;
    if(!rawText) return alert("Please load text inputs first.");

    showLoader("🧠 Cloud Cluster Server Function Processing AI Pipelines...");

    try {
        const res = await fetch(`${API_BASE}/api/explain`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: rawText, language: currentLang })
        });
        const data = await res.json();
        
        document.getElementById("emptyState").classList.add("hidden");
        document.getElementById("lessonText").innerText = data.explanation;
        document.getElementById("lessonWidget").classList.remove("hidden");
        
        localActiveQuestion = data.quiz_question;
        document.getElementById("quizText").innerText = localActiveQuestion;
        document.getElementById("quizWidget").classList.remove("hidden");
    } catch(err) {
        alert("Server function network pipeline error.");
    } finally {
        hideLoader();
    }
});

document.getElementById("imageUpload").addEventListener("change", async (event) => {
    const fileList = event.target.files;
    const currentLang = document.getElementById("lang").value;
    if (!fileList || fileList.length === 0) return;

    showLoader("📁 Streaming Media Asset to Vercel Serverless Architecture Node...");

    const formData = new FormData();
    formData.append("file", fileList[0]);
    formData.append("language", currentLang);

    try {
        const response = await fetch(`${API_BASE}/api/upload`, {
            method: "POST",
            body: formData
        });
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById("ocrBox").value = data.extracted_text;
            document.getElementById("emptyState").classList.add("hidden");
            document.getElementById("lessonText").innerText = data.explanation;
            document.getElementById("lessonWidget").classList.remove("hidden");
            
            localActiveQuestion = data.quiz_question;
            document.getElementById("quizText").innerText = localActiveQuestion;
            document.getElementById("quizWidget").classList.remove("hidden");
        } else {
            alert("Error parsing parameters via Gemini Vision Engine.");
        }
    } catch (err) {
        alert("Failed to communicate with cloud parsing routes.");
    } finally {
        hideLoader();
    }
});

document.getElementById("ttsBtn").addEventListener("click", () => {
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(document.getElementById("lessonText").innerText));
});

document.getElementById("evaluateBtn").addEventListener("click", async () => {
    const answer = document.getElementById("studentAnswerBox").value.trim();
    if(!answer) return alert("Please type your response entry parameter.");

    showLoader("📊 Live Response Evaluation Pipeline Context Mapping...");

    try {
        const res = await fetch(`${API_BASE}/api/evaluate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: localActiveQuestion, student_answer: answer })
        });
        const data = await res.json();
        
        document.getElementById("evaluationText").innerText = data.evaluation;
        document.getElementById("evaluationWidget").classList.remove("hidden");
    } catch(err) {
        alert("Evaluation parsing network fault.");
    } finally {
        hideLoader();
    }
});