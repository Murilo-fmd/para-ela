document.addEventListener('DOMContentLoaded', function() {
    const startBtn = document.getElementById("startBtn");
    const startScreen = document.getElementById("startScreen");
    const mainContent = document.getElementById("mainContent");
    const carousel = document.getElementById("carousel");
    const contador = document.getElementById("contador");
    const music = document.getElementById("music");
    const playPauseBtn = document.getElementById("playPauseBtn");
    const progress = document.getElementById("progress");
    const slidesContainer = carousel.querySelector(".slides");
    const slides = slidesContainer.querySelectorAll("img");
    const indicatorsContainer = document.getElementById("indicatorsContainer");

    let currentIndex = 0;
    const totalSlides = 14; // Suas 14 fotos
    let autoSlide;
    let isTransitioning = false;
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    // --- CLONAGEM AUTOMÁTICA (igual ao Swiper faz) ---
    function setupInfiniteCarousel() {
        // Salva as imagens originais
        const originalSlides = Array.from(slides);
        
        // Limpa o container
        slidesContainer.innerHTML = '';
        
        // Adiciona as originais
        originalSlides.forEach(slide => {
            slidesContainer.appendChild(slide.cloneNode(true));
        });
        
        // Adiciona as mesmas imagens novamente (clones para o efeito infinito)
        originalSlides.forEach(slide => {
            const clone = slide.cloneNode(true);
            clone.alt = slide.alt + " (clone)";
            slidesContainer.appendChild(clone);
        });
        
        // Adiciona mais um conjunto para garantir o loop suave
        originalSlides.forEach(slide => {
            const clone = slide.cloneNode(true);
            clone.alt = slide.alt + " (clone 2)";
            slidesContainer.appendChild(clone);
        });
        
        // Agora temos 42 slides (14 originais + 28 clones)
        // Começamos no primeiro clone (posição 14) para dar efeito infinito
        currentIndex = totalSlides;
        
        // Posiciona no início dos clones
        slidesContainer.style.transition = 'none';
        slidesContainer.style.transform = `translateX(-${currentIndex * 100}%)`;
        
        // Atualiza os dots
        updateDots();
    }

    // --- Atualizar indicador de tempo ---
    function updateTimeIndicator() {
        const currentTime = formatTime(music.currentTime);
        const duration = formatTime(music.duration);
        
        document.getElementById('timeIndicator').innerHTML = `
            <span class="current-time">${currentTime}</span>
            <span class="total-time">${duration}</span>
        `;
    }

    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec.toString().padStart(2, '0')}`;
    }

    // --- Criar indicadores dinamicamente ---
    function createIndicators() {
        indicatorsContainer.innerHTML = '';
        
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('span');
            dot.className = `dot ${i === 0 ? 'active' : ''}`;
            dot.addEventListener('click', () => {
                goToSlide(i);
            });
            indicatorsContainer.appendChild(dot);
        }
    }

    function updateDots() {
        // Calcula qual foto original está sendo mostrada
        const originalIndex = currentIndex % totalSlides;
        
        document.querySelectorAll('.dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === originalIndex);
        });
    }

    // --- Botão inicial ---
    startBtn.addEventListener("click", (e) => {
        startScreen.style.opacity = "0";

        setTimeout(() => {
            startScreen.style.display = "none";
            mainContent.classList.remove("hidden");

            // Configura o carrossel infinito (clonagem automática)
            setupInfiniteCarousel();

            music.play().then(() => {
                playPauseBtn.classList.add('playing');
            }).catch(error => {
                console.log("Reprodução automática bloqueada");
            });

            startAutoSlide();
            createHearts();

        }, 200);
    });

    // --- Player ---
    playPauseBtn.addEventListener("click", () => {
        if (music.paused) {
            music.play().then(() => {
                playPauseBtn.classList.add('playing');
            }).catch(e => {
                console.log("Erro ao reproduzir:", e);
            });
        } else {
            music.pause();
            playPauseBtn.classList.remove('playing');
        }
    });

    music.addEventListener("timeupdate", () => {
        const percent = (music.currentTime / music.duration) * 100;
        progress.style.width = percent + "%";
        updateTimeIndicator();
    });

    music.addEventListener("play", function() {
        playPauseBtn.classList.add('playing');
    });

    music.addEventListener("pause", function() {
        playPauseBtn.classList.remove('playing');
    });

    music.addEventListener("ended", function() {
        playPauseBtn.classList.remove('playing');
    });

    // --- CARROSSEL INFINITO (ESTILO SWIPER) ---
    function updateSlide(animate = true) {
        if (!animate) {
            slidesContainer.style.transition = 'none';
        } else {
            slidesContainer.style.transition = 'transform 0.5s ease-in-out';
        }
        
        slidesContainer.style.transform = `translateX(-${currentIndex * 100}%)`;
        updateDots();
    }

    function nextSlide() {
        if (isTransitioning) return;
        isTransitioning = true;
        
        currentIndex++;
        updateSlide(true);
        
        // Verifica se precisa resetar (quando chega perto do final dos clones)
        if (currentIndex >= totalSlides * 3 - 1) {
            setTimeout(() => {
                slidesContainer.style.transition = 'none';
                currentIndex = totalSlides; // Volta para o primeiro clone
                slidesContainer.style.transform = `translateX(-${currentIndex * 100}%)`;
                updateDots();
                
                setTimeout(() => {
                    slidesContainer.style.transition = 'transform 0.5s ease-in-out';
                    isTransitioning = false;
                }, 50);
            }, 500);
        } else {
            setTimeout(() => {
                isTransitioning = false;
            }, 500);
        }
    }

    function prevSlide() {
        if (isTransitioning) return;
        isTransitioning = true;
        
        currentIndex--;
        updateSlide(true);
        
        // Verifica se precisa resetar (quando chega no início)
        if (currentIndex < 0) {
            setTimeout(() => {
                slidesContainer.style.transition = 'none';
                currentIndex = totalSlides * 2 - 1; // Vai para o último clone
                slidesContainer.style.transform = `translateX(-${currentIndex * 100}%)`;
                updateDots();
                
                setTimeout(() => {
                    slidesContainer.style.transition = 'transform 0.5s ease-in-out';
                    isTransitioning = false;
                }, 50);
            }, 500);
        } else {
            setTimeout(() => {
                isTransitioning = false;
            }, 500);
        }
    }

    function goToSlide(index) {
        if (isTransitioning) return;
        
        // Vai para o clone correspondente (sempre nos clones do meio)
        currentIndex = index + totalSlides;
        updateSlide(true);
        
        clearInterval(autoSlide);
        startAutoSlide();
        
        setTimeout(() => {
            isTransitioning = false;
        }, 500);
    }

    function startAutoSlide() {
        if (autoSlide) clearInterval(autoSlide);
        autoSlide = setInterval(() => {
            nextSlide();
        }, 4000);
    }

    // --- Arraste ---
    carousel.addEventListener('mousedown', startDrag);
    carousel.addEventListener('touchstart', startDrag);
    carousel.addEventListener('mousemove', drag);
    carousel.addEventListener('touchmove', drag);
    carousel.addEventListener('mouseup', endDrag);
    carousel.addEventListener('touchend', endDrag);
    carousel.addEventListener('mouseleave', endDrag);

    function startDrag(e) {
        if (isTransitioning) return;
        
        isDragging = true;
        startX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
        currentX = startX;
        carousel.style.cursor = 'grabbing';
        slidesContainer.style.transition = 'none';
        clearInterval(autoSlide);
    }

    function drag(e) {
        if (!isDragging || isTransitioning) return;
        e.preventDefault();
        
        currentX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
        const diff = currentX - startX;
        const slideWidth = carousel.offsetWidth;
        const dragPercentage = (diff / slideWidth) * 100;
        const currentPercentage = -currentIndex * 100;
        
        slidesContainer.style.transform = `translateX(calc(${currentPercentage}% + ${dragPercentage}%))`;
    }

    function endDrag(e) {
        if (!isDragging || isTransitioning) return;
        
        isDragging = false;
        carousel.style.cursor = 'grab';
        
        const diff = currentX - startX;
        const slideWidth = carousel.offsetWidth;
        const threshold = slideWidth * 0.15;
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                prevSlide();
            } else {
                nextSlide();
            }
        } else {
            updateSlide(true);
            startAutoSlide();
        }
    }

    // --- Contador ---
    const dataInicio = new Date("2017-09-26T00:00:00");
    function atualizarContador() {
        const agora = new Date();
        const diff = agora - dataInicio;
        const segundos = Math.floor((diff / 1000) % 60);
        const minutos = Math.floor((diff / 1000 / 60) % 60);
        const horas = Math.floor((diff / 1000 / 60 / 60) % 24);
        const diasTotais = Math.floor(diff / 1000 / 60 / 60 / 24);
        const anos = Math.floor(diasTotais / 365);
        const meses = Math.floor((diasTotais % 365) / 30);
        const dias = (diasTotais % 365) % 30;
        contador.innerHTML = `
            <div style="font-size: 0.9rem; margin-bottom: 5px; color: #fff;">Nosso tempo juntos:</div>
            <div style="font-weight: 700; color: #3b165c;">${anos} anos, ${meses} meses, ${dias} dias</div>
            <div style="font-size: 0.8rem; color: #9176bf;">${horas}h ${minutos}m ${segundos}s</div>
        `;
    }

    // --- ANIMAÇÃO DE CORAÇÕES ---
    function createHearts() {
        let heartContainer = document.querySelector('.heart-background');
        if (!heartContainer) {
            heartContainer = document.createElement('div');
            heartContainer.className = 'heart-background';
            document.body.appendChild(heartContainer);
        }

        function createHeart() {
            const heart = document.createElement('div');
            heart.className = 'heart';
            
            const size = Math.random();
            if (size < 0.33) {
                heart.classList.add('small');
            } else if (size < 0.66) {
                heart.classList.add('medium');
            } else {
                heart.classList.add('large');
            }
            
            heart.style.left = Math.random() * 100 + '%';
            heart.style.animationDelay = Math.random() * 5 + 's';
            
            const hearts = ['❤️', '🧡', '💛', '💚', '💙', '💜', '🩷', '💖', '💗', '💓', '💞'];
            heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
            
            heartContainer.appendChild(heart);
            
            setTimeout(() => {
                heart.remove();
            }, 16000);
        }

        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                createHeart();
            }, i * 300);
        }

        setInterval(createHeart, 2000);
    }

    // --- Inicialização ---
    createIndicators();
    setInterval(atualizarContador, 1000);
    atualizarContador();
    updateTimeIndicator();
    
    // A configuração do carrossel será feita após o clique no botão
});