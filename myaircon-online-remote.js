// 기본 딜레이 타임 (밀리초 단위)
let delayTime = 500;

// 자동 조절 상태 변수
let autoAdjustEnabled = true;

// 마지막 조절 시간을 추적하는 변수
let lastAdjustmentTime = 0;

// 점유율을 계산하기 위한 변수
let temperatureCounts = { below: 0, desired: 0, above: 0 };
const desiredTemperature = 27;
const sampleDuration = 1000; // 1초 동안 샘플링
const targetPercentage = 38;

// 온도를 표시하는 요소 선택
const h4Element = document.querySelector('body > div:nth-child(1) > div.temp-box > h4');
// plus 및 minus 버튼 선택
const plusButton = document.querySelector('.plus');
const minusButton = document.querySelector('.minus');

// 온도 조절 함수
function adjustTemperature(currentValue) {
    const currentTime = Date.now();
    if (currentTime - lastAdjustmentTime < delayTime) {
        return; // 마지막 조절 후 충분한 시간이 지나지 않았으면 리턴
    }
    
    if (currentValue < desiredTemperature && plusButton) {
        plusButton.click();
        lastAdjustmentTime = currentTime;
    } else if (currentValue > desiredTemperature && minusButton) {
        minusButton.click();
        lastAdjustmentTime = currentTime;
    }
}

// 점유율 계산 및 자동 조절 기능
function calculateTemperaturePercentage() {
    const totalSamples = temperatureCounts.below + temperatureCounts.desired + temperatureCounts.above;
    const percentage = totalSamples > 0 ? (temperatureCounts.desired / totalSamples) * 100 : 0;

    // 화면에 로그 업데이트
    const logElement = document.querySelector('#log-display');
    if (logElement) {
        logElement.innerHTML = `
            Below: ${temperatureCounts.below} / 
            Desired: ${temperatureCounts.desired} /
            Above: ${temperatureCounts.above}
            Temperature percentage in the last 1 seconds: ${percentage.toFixed(2)}%
        `;
    }

    // 자동 조절 로직
    if (percentage < targetPercentage) {
        if (delayTime > 150) delayTime -= 10; // 최소 딜레이 타임을 150ms로 설정
    } else if (percentage >= targetPercentage) {
        if (delayTime < 1000) delayTime += 10; // 최대 딜레이 타임을 1000ms로 설정
    }

    // 슬라이더와 값 표시 업데이트
    updateSliderValue();
    
    // 점유율 계산 후 데이터 초기화
    temperatureCounts = { below: 0, desired: 0, above: 0 };
}

// 슬라이더와 값 업데이트 함수
function updateSliderValue() {
    const slider = document.querySelector('input[type="range"]');
    if (slider) {
        slider.value = delayTime;
        const valueDisplay = slider.nextElementSibling;
        if (valueDisplay) valueDisplay.textContent = delayTime + 'ms';
    }
    // 실시간 딜레이 타임 표시 업데이트
    const delayTimeDisplay = document.querySelector('#delay-time-display');
    if (delayTimeDisplay) {
        delayTimeDisplay.textContent = `Current Delay Time: ${delayTime}ms`;
    }
}

// MutationObserver 설정
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
            const currentValue = parseInt(h4Element.textContent.trim(), 10);
            if (!isNaN(currentValue)) {
                if (autoAdjustEnabled) {
                    adjustTemperature(currentValue);
                }
                
                // 점유율 데이터 업데이트
                if (currentValue < desiredTemperature) {
                    temperatureCounts.below++;
                } else if (currentValue === desiredTemperature) {
                    temperatureCounts.desired++;
                } else if (currentValue > desiredTemperature) {
                    temperatureCounts.above++;
                }
            }
        }
    });
});

// UI 생성 함수
function createControlUI() {
    const controlDiv = document.createElement('div');
    controlDiv.style.position = 'fixed';
    controlDiv.style.top = '10px';
    controlDiv.style.right = '10px';
    controlDiv.style.backgroundColor = 'white';
    controlDiv.style.padding = '10px';
    controlDiv.style.border = '1px solid black';
    controlDiv.style.zIndex = 1000; // 화면의 다른 요소 위에 표시되도록 설정

    const delayControl = createSlider('delayTime', 100, 1000, delayTime); // 슬라이더 범위 수정
    controlDiv.appendChild(delayControl);

    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Toggle Auto Adjust';
    toggleButton.onclick = () => {
        autoAdjustEnabled = !autoAdjustEnabled;
        toggleButton.textContent = autoAdjustEnabled ? 'Disable Auto Adjust' : 'Enable Auto Adjust';
    };
    controlDiv.appendChild(toggleButton);

    const delayTimeDisplay = document.createElement('div');
    delayTimeDisplay.id = 'delay-time-display';
    delayTimeDisplay.textContent = `Current Delay Time: ${delayTime}ms`;
    controlDiv.appendChild(delayTimeDisplay);

    const logDisplay = document.createElement('div');
    logDisplay.id = 'log-display';
    logDisplay.style.position = 'fixed';
    logDisplay.style.bottom = '10px';
    logDisplay.style.right = '10px';
    logDisplay.style.backgroundColor = 'white';
    logDisplay.style.padding = '10px';
    logDisplay.style.border = '1px solid black';
    logDisplay.style.zIndex = 1000; // 화면의 다른 요소 위에 표시되도록 설정
    controlDiv.appendChild(logDisplay);

    document.body.appendChild(controlDiv);

    // 자동 조절 타이머 설정
    setInterval(calculateTemperaturePercentage, sampleDuration);
}

// 슬라이더 생성 함수
function createSlider(name, min, max, value) {
    const container = document.createElement('div');
    container.style.marginBottom = '10px';

    const label = document.createElement('label');
    label.textContent = `${name}: `;
    label.style.display = 'block';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min;
    slider.max = max;
    slider.value = value;
    slider.style.width = '100%';

    const valueDisplay = document.createElement('span');
    valueDisplay.textContent = value + 'ms';

    slider.oninput = function() {
        const newValue = parseInt(this.value);
        valueDisplay.textContent = newValue + 'ms';
        delayTime = newValue;
        updateSliderValue(); // 슬라이더 값 변경 시에도 실시간으로 딜레이 타임 업데이트
    };

    container.appendChild(label);
    container.appendChild(slider);
    container.appendChild(valueDisplay);

    return container;
}

// 초기 실행
if (h4Element && plusButton && minusButton) {
    createControlUI();
    observer.observe(h4Element, { childList: true, characterData: true, subtree: true });
    console.log('Temperature control automation started');
} else {
    console.error('One or more required elements not found');
}