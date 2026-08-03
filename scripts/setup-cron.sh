#!/bin/bash
# Setup cron jobs for automated scraping
# Run this once on VPS: bash /opt/anandi-park/anandi/scripts/setup-cron.sh

APP_DIR="/opt/anandi-park/anandi"

# Install chromium if not present
if ! command -v chromium &> /dev/null && ! command -v chromium-browser &> /dev/null; then
  echo "Installing Chromium..."
  apt-get update && apt-get install -y chromium-browser
fi

# Install puppeteer in the project
cd $APP_DIR
npm install puppeteer --legacy-peer-deps 2>/dev/null

# Add cron jobs
(crontab -l 2>/dev/null | grep -v 'anandi-park.*scraper') | crontab -
(crontab -l 2>/dev/null; echo "# Anandi Park Lead Scrapers") | crontab -
(crontab -l 2>/dev/null; echo "0 6,12,18 * * * cd $APP_DIR && /usr/bin/node scripts/real-scraper.js >> /var/log/anandi-scraper.log 2>&1") | crontab -
(crontab -l 2>/dev/null; echo "0 8,20 * * * cd $APP_DIR && /usr/bin/node scripts/scrape-listings.js >> /var/log/anandi-scraper.log 2>&1") | crontab -

echo "✅ Cron jobs installed:"
echo "   - Google Maps scraper: 6AM, 12PM, 6PM daily"
echo "   - Listing sites scraper: 8AM, 8PM daily"
echo ""
echo "Verify with: crontab -l"
echo "Logs at: /var/log/anandi-scraper.log"
