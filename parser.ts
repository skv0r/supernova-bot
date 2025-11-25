import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function downloadJsonFile(url: string) {
    // Путь к текущей папке, где находится скрипт
    const downloadPath = path.join(__dirname);

    // Запускаем браузер с аргументами для скачивания в текущую директорию
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            `--disable-web-security`,
            `--disable-features=IsolateOrigins,site-per-process`,
            `--no-sandbox`,
            `--disable-setuid-sandbox`,
            `--disable-dev-shm-usage`,
            `--disable-software-rasterizer`,
            `--disable-gpu`,
            `--window-size=1920x1080`,
            `--disable-extensions`,
            `--disable-infobars`,
            `--disable-translate`,
            `--download-dir=${downloadPath}` // Указываем путь для загрузок
        ],
        defaultViewport: null,
    });

    const page = await browser.newPage();

    // Переходим на страницу
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Получаем содержимое страницы
    const pageContent = await page.content();

    // Сохраняем содержимое страницы в файл
    const filePath = path.join(downloadPath, 'page_content.html');
    fs.writeFileSync(filePath, pageContent, 'utf8');
    console.log('Page content has been saved to:', filePath);

    // Селектор для кнопки
    const downloadButtonSelector = 'button.MuiButton-outlined';

    try {
        console.log('Waiting for button to become visible...');
        // Ожидаем, пока кнопка станет доступной с увеличенным таймаутом
        await page.waitForSelector(downloadButtonSelector, { timeout: 15000 }); // увеличиваем таймаут до 15 секунд
        console.log('Button found!');

        // Прокручиваем страницу, чтобы кнопка оказалась в видимой области
        console.log('Scrolling to the button...');
        await page.evaluate((selector) => {
            const button = document.querySelector(selector);
            if (button) {
                button.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, downloadButtonSelector);

        console.log('Waiting for the button to be clickable...');
        // Пробуем кликнуть через JavaScript (evaluate)
        const button = await page.$(downloadButtonSelector);
        if (button) {
            // Используем evaluate для клика через JS, чтобы обойти ограничение Puppeteer
            await page.evaluate((btn) => {
                btn.click();
            }, button);
            console.log('Button clicked!');
        } else {
            console.error('Button is not found after scrolling');
        }

        // Ожидаем скачивания файла (проверка происходит по времени ожидания)
        console.log('Waiting for file download...');
        await page.waitForTimeout(3000); // Ждем 3 секунды для скачивания

        // Скачиваем файл в текущую директорию
        const downloadedFilePath = path.join(downloadPath, 'lobby_data.json');
        const data = await page.content();
        fs.writeFileSync(downloadedFilePath, data);

        console.log('JSON файл скачан в:', downloadedFilePath);
    } catch (error) {
        console.error('Error while waiting for button or clicking:', error);
    }

    await browser.close();
}

// Пример использования
const url = 'https://eternalesports.club/lobbies/3/19882b'; // Замени на актуальный URL

// Запускаем функцию
downloadJsonFile(url);
