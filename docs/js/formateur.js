const API_URL = 'https://suivi-presence-success.vercel.app/api';

const formateurNom = document.getElementById('formateur-nom');
const formateurPrenom = document.getElementById('formateur-prenom');
const formation = document.getElementById('formation');
const currentDateEl = document.getElementById('current-date');
const currentSlotEl = document.getElementById('current-slot');
const generateQRBtn = document.getElementById('generate-qr');
const qrSection = document.getElementById('qr-section');
const qrcodeContainer = document.getElementById('qrcode-container');
const qrValidity = document.getElementById('qr-validity');
const downloadQRBtn = document.getElementById('download-qr');
const attendanceList = document.getElementById('attendance-list');

let sessionData = null;
let qrCodeData = null;

document.addEventListener('DOMContentLoaded', () => {
    updateDateTime();
    setInterval(updateDateTime, 60000);
    loadTodayAttendance();
    setInterval(loadTodayAttendance, 30000);
});

function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.textContent = now.toLocaleDateString('fr-FR', options);
    
    const slot = getCurrentSlot();
    if (slot) {
        currentSlotEl.textContent = slot.label;
        currentSlotEl.style.color = '#11998e';
        generateQRBtn.disabled = false;
        generateQRBtn.textContent = '🔗 Générer QR Code de Pointage';
    } else {
        currentSlotEl.textContent = '⚠️ Hors horaires de pointage';
        currentSlotEl.style.color = '#eb3349';
        generateQRBtn.disabled = true;
        generateQRBtn.textContent = '❌ Hors horaires de pointage';
    }
}

function getCurrentSlot() {
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const time = hours * 60 + minutes;
    
    if (day === 0 || day === 6) return null;
    
    if (time >= 510 && time <= 720) {
        return { id: 'matin', label: '🌅 Matin (8h30 - 12h00)' };
    }
    
    if (time >= 780 && time <= 990) {
        return { id: 'apres-midi', label: '🌆 Après-midi (13h00 - 16h30)' };
    }
    
    return null;
}

generateQRBtn.addEventListener('click', async () => {
    if (!formateurNom.value.trim() || !formateurPrenom.value.trim() || !formation.value) {
        alert('⚠️ Veuillez remplir tous les champs obligatoires');
        return;
    }
    
    const slot = getCurrentSlot();
    if (!slot) {
        alert('⚠️ Le pointage n\'est pas disponible en dehors des horaires de formation');
        return;
    }
    
    sessionData = {
        formateurNom: formateurNom.value.trim().toUpperCase(),
        formateurPrenom: formateurPrenom.value.trim(),
        formation: formation.value,
        date: new Date().toISOString().split('T')[0],
        creneau: slot.id,
        creneauLabel: slot.label
    };
    
    try {
        // 🔧 MODIFICATION : Créer la session côté serveur et obtenir un code court
        const response = await fetch(`${API_URL}/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sessionData)
        });
        
        if (!response.ok) throw new Error('Erreur création session');
        
        const { sessionCode } = await response.json();
        
        // 🔧 URL COURTE avec uniquement le code de session
        const baseURL = window.location.or
