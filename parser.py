import os
import time
import chromedriver_autoinstaller
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Устанавливаем нужную версию ChromeDriver, если ещё не установлена
chromedriver_autoinstaller.install()

# Определяем путь для скачивания
download_path = os.getcwd()  # Текущая рабочая директория, где находится скрипт

# Настроим параметры для Chrome
chrome_options = Options()
chrome_options.add_argument("--headless")  # Запуск в фоновом режиме
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")
chrome_options.add_argument("--disable-extensions")

# Указываем путь для скачивания с помощью Chrome Preferences
prefs = {
    "download.default_directory": download_path,  # Устанавливаем папку для загрузки
    "download.prompt_for_download": False,  # Отключаем запрос на подтверждение скачивания
    "directory_upgrade": True
}
chrome_options.add_experimental_option("prefs", prefs)

# Запуск браузера
driver = webdriver.Chrome(options=chrome_options)

# Открываем страницу с матчем
url = 'https://eternalesports.club/lobbies/3/19882b'  # Замени на актуальный URL
driver.get(url)

# Ждем, пока страница загрузится
time.sleep(3)

# Ищем кнопку для скачивания
download_button = driver.find_element(By.CSS_SELECTOR, "button.MuiButton-outlined")

# Прокручиваем страницу, чтобы кнопка стала видимой
driver.execute_script("arguments[0].scrollIntoView();", download_button)

# Увеличиваем время ожидания до 20 секунд и проверяем, что кнопка кликабельна
try:
    print("Waiting for button to become clickable...")
    wait = WebDriverWait(driver, 20)  # Увеличиваем таймаут до 20 секунд
    wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button.MuiButton-outlined")))

    # Пробуем кликнуть по кнопке
    download_button.click()
    print("Кнопка нажата!")
except Exception as e:
    print(f"Ошибка при клике по кнопке: {e}")
    # Если обычный клик не сработал, пытаемся кликнуть через JavaScript
    driver.execute_script("arguments[0].click();", download_button)
    print("Кнопка нажата через JavaScript!")

# Ждем завершения скачивания
time.sleep(3)

# Закрываем браузер
driver.quit()

print(f"Файл был скачан в папку: {download_path}")
