import { firefox } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import { LOBBY_URLS, DATA_FOLDER } from '../config/constants';

// Папка назначения — deployment/db относительно корня проекта
const downloadPath = path.resolve(process.cwd(), DATA_FOLDER);

// Создать папку, если её нет
if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath, { recursive: true });
}

/**
 * Парсит один лобби
 */
async function parseLobby(page: any, url: string, lobbyIndex: number) {
    console.log(`\n[${lobbyIndex + 1}/${LOBBY_URLS.length}] Открываю страницу: ${url}`);
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
        
        console.log(`✅ Файл сохранен: ${filePath}`);
        return true;
        
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
            
            console.log(`✅ Файл сохранен: ${filePath}`);
            return true;
        } catch (retryError) {
            console.error(`❌ Повторная попытка не удалась: ${retryError}`);
            return false;
        }
    }
}

async function runParser() {
    console.log('🚀 Запуск парсера для всех лобби...');
    console.log(`Всего лобби для парсинга: ${LOBBY_URLS.length}\n`);
    
    // Запуск браузера Firefox в headless режиме
    const browser = await firefox.launch({
        headless: true,
    });

    const context = await browser.newContext({
        acceptDownloads: true, // Разрешаем загрузки
    });

    const page = await context.newPage();

    let successCount = 0;
    let failCount = 0;

    // Парсим каждый лобби
    for (let i = 0; i < LOBBY_URLS.length; i++) {
        const url = LOBBY_URLS[i];
        const success = await parseLobby(page, url, i);
        
        if (success) {
            successCount++;
        } else {
            failCount++;
        }

        // Небольшая пауза между запросами
        if (i < LOBBY_URLS.length - 1) {
            console.log('Пауза 2 секунды перед следующим лобби...');
            await page.waitForTimeout(2000);
        }
    }

    // Закрываем браузер
    await browser.close();

    console.log('\n' + '='.repeat(60));
    console.log('📊 ИТОГИ ПАРСИНГА:');
    console.log(`✅ Успешно: ${successCount}`);
    console.log(`❌ Ошибки: ${failCount}`);
    console.log(`📁 Папка с файлами: ${downloadPath}`);
    console.log('='.repeat(60));
}

// Запуск парсера
runParser().catch(error => {
    console.error('Ошибка при выполнении парсера:', error);
    process.exit(1);
});

