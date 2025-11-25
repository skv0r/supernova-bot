import { firefox } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Получаем путь к текущему файлу (для ES модулей)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Определяем путь для скачивания
// Новая папка назначения — deployment/db относительно текущего местоположения скрипта
const downloadPath = path.resolve(__dirname, '../../deployment/db');

// Создать папку, если её нет
if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath, { recursive: true });
}

async function runParser() {
    console.log('Запуск парсера...');
    
    // Запуск браузера Firefox в headless режиме
    const browser = await firefox.launch({
        headless: true,
    });

    const context = await browser.newContext({
        acceptDownloads: true, // Разрешаем загрузки
    });

    const page = await context.newPage();

    // Открываем страницу с матчем
    const url = 'https://eternalesports.club/lobbies/3/19882b'; // Замени на актуальный URL
    console.log(`Открываю страницу: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle' });

    // Ждем, пока страница полностью загрузится
    console.log('Страница загружена, ожидание полной загрузки...');
    await page.waitForTimeout(3000);

    try {
        console.log('Ожидание кнопки для скачивания...');
        
        // Ищем кнопку для скачивания и ждем, пока она станет видимой и кликабельной
        const downloadButton = page.locator('button.MuiButton-outlined');
        
        // Прокручиваем страницу, чтобы кнопка стала видимой
        await downloadButton.scrollIntoViewIfNeeded();
        
        // Ждем, пока кнопка станет видимой и кликабельной (до 20 секунд)
        await downloadButton.waitFor({ state: 'visible', timeout: 20000 });
        
        console.log('Кнопка найдена, кликаю...');
        
        // Ожидаем начала загрузки и кликаем по кнопке
        const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
        await downloadButton.click();
        
        console.log('Кнопка нажата, ожидание загрузки...');
        
        // Ждем завершения загрузки
        const download = await downloadPromise;
        console.log(`Загрузка началась: ${download.suggestedFilename()}`);
        
        // Сохраняем файл в нужную папку
        const fileName = download.suggestedFilename();
        const filePath = path.join(downloadPath, fileName);
        await download.saveAs(filePath);
        
        console.log(`Файл сохранен: ${filePath}`);
        
    } catch (error) {
        console.error(`Ошибка при клике по кнопке или загрузке: ${error}`);
        
        // Если обычный клик не сработал, пытаемся кликнуть через JavaScript
        try {
            const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
            
            await page.evaluate(() => {
                const button = document.querySelector('button.MuiButton-outlined') as HTMLElement;
                if (button) {
                    button.click();
                }
            });
            
            console.log('Кнопка нажата через JavaScript, ожидание загрузки...');
            
            const download = await downloadPromise;
            console.log(`Загрузка началась: ${download.suggestedFilename()}`);
            
            const fileName = download.suggestedFilename();
            const filePath = path.join(downloadPath, fileName);
            await download.saveAs(filePath);
            
            console.log(`Файл сохранен: ${filePath}`);
        } catch (retryError) {
            console.error(`Повторная попытка не удалась: ${retryError}`);
            throw retryError;
        }
    }

    // Закрываем браузер
    await browser.close();

    console.log(`Файл был скачан в папку: ${downloadPath}`);
}

// Запуск парсера
runParser().catch(error => {
    console.error('Ошибка при выполнении парсера:', error);
    process.exit(1);
});

