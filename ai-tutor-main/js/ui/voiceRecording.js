// Voice Recording Functionality with OpenAI Whisper integration
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

window.toggleVoiceRecording = async function () {
    const voiceBtn = document.getElementById('voice-btn');
    const icon = voiceBtn?.querySelector('i');

    if (!isRecording) {
        // Start recording
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                audioChunks = [];

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());

                // Reset button UI immediately
                isRecording = false;
                if (icon) {
                    icon.className = 'fa-solid fa-microphone';
                    voiceBtn.style.background = '';
                    voiceBtn.style.color = '';
                }

                // Show processing indicator
                const userInput = document.getElementById('user-input');
                if (userInput) {
                    userInput.value = '🎤 Transcribing...';
                    userInput.disabled = true;
                }

                try {
                    // Convert blob to base64
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                        const base64Audio = reader.result;

                        try {
                            // Send to server for transcription
                            const response = await fetch('/.netlify/functions/transcribe', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ audio: base64Audio })
                            });

                            const data = await response.json();

                            if (userInput) {
                                userInput.disabled = false;
                                if (response.ok && data.text) {
                                    userInput.value = data.text;
                                    userInput.focus();
                                } else {
                                    userInput.value = '';
                                    alert('Transcription failed: ' + (data.error || 'Unknown error'));
                                }
                            }
                        } catch (fetchError) {
                            console.error('Transcription fetch error:', fetchError);
                            if (userInput) {
                                userInput.disabled = false;
                                userInput.value = '';
                                alert('Could not connect to transcription service. Please try again.');
                            }
                        }
                    };
                    reader.readAsDataURL(audioBlob);

                } catch (error) {
                    console.error('Transcription error:', error);
                    if (userInput) {
                        userInput.disabled = false;
                        userInput.value = '';
                        alert('Voice transcription failed: ' + error.message);
                    }
                }
            };

            mediaRecorder.start();
            isRecording = true;

            // Update button UI
            if (icon) {
                icon.className = 'fa-solid fa-stop';
                voiceBtn.style.background = '#ef4444';
                voiceBtn.style.color = 'white';
            }

        } catch (error) {
            console.error('Microphone access denied:', error);
            alert('Microphone access denied. Please allow microphone access to use voice recording.');
        }
    } else {
        // Stop recording
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
    }
};
