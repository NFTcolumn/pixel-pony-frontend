#!/bin/bash

# Pixel Ponies Mini App Verification Script
# Run this after deployment to verify everything is working

echo "🐴 Pixel Ponies Mini App Verification"
echo "======================================"
echo ""

DOMAIN="pixel-pony-frontend.onrender.com"
MANIFEST_URL="https://$DOMAIN/.well-known/farcaster.json"
MINIAPP_URL="https://$DOMAIN/miniapp.html"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Manifest exists and is valid
echo "1️⃣  Checking manifest..."
MANIFEST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$MANIFEST_URL")

if [ "$MANIFEST_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✅ Manifest exists (HTTP 200)${NC}"

    # Check if it's valid JSON
    MANIFEST_JSON=$(curl -s "$MANIFEST_URL")
    if echo "$MANIFEST_JSON" | jq empty 2>/dev/null; then
        echo -e "${GREEN}✅ Manifest is valid JSON${NC}"

        # Check required fields
        HAS_ACCOUNT=$(echo "$MANIFEST_JSON" | jq -e '.accountAssociation' >/dev/null 2>&1 && echo "yes" || echo "no")
        HAS_MINIAPP=$(echo "$MANIFEST_JSON" | jq -e '.miniapp' >/dev/null 2>&1 && echo "yes" || echo "no")
        HAS_NAME=$(echo "$MANIFEST_JSON" | jq -e '.miniapp.name' >/dev/null 2>&1 && echo "yes" || echo "no")
        HAS_HOME=$(echo "$MANIFEST_JSON" | jq -e '.miniapp.homeUrl' >/dev/null 2>&1 && echo "yes" || echo "no")
        HAS_ICON=$(echo "$MANIFEST_JSON" | jq -e '.miniapp.iconUrl' >/dev/null 2>&1 && echo "yes" || echo "no")

        if [ "$HAS_ACCOUNT" == "yes" ]; then
            echo -e "${GREEN}✅ accountAssociation present${NC}"
        else
            echo -e "${RED}❌ accountAssociation missing${NC}"
        fi

        if [ "$HAS_MINIAPP" == "yes" ]; then
            echo -e "${GREEN}✅ miniapp config present${NC}"
        else
            echo -e "${RED}❌ miniapp config missing${NC}"
        fi

        if [ "$HAS_NAME" == "yes" ]; then
            NAME=$(echo "$MANIFEST_JSON" | jq -r '.miniapp.name')
            echo -e "${GREEN}✅ miniapp.name: $NAME${NC}"
        else
            echo -e "${RED}❌ miniapp.name missing${NC}"
        fi

        if [ "$HAS_HOME" == "yes" ]; then
            HOME=$(echo "$MANIFEST_JSON" | jq -r '.miniapp.homeUrl')
            echo -e "${GREEN}✅ miniapp.homeUrl: $HOME${NC}"
        else
            echo -e "${RED}❌ miniapp.homeUrl missing${NC}"
        fi

        if [ "$HAS_ICON" == "yes" ]; then
            ICON=$(echo "$MANIFEST_JSON" | jq -r '.miniapp.iconUrl')
            echo -e "${GREEN}✅ miniapp.iconUrl: $ICON${NC}"
        else
            echo -e "${RED}❌ miniapp.iconUrl missing${NC}"
        fi
    else
        echo -e "${RED}❌ Manifest is not valid JSON${NC}"
    fi
else
    echo -e "${RED}❌ Manifest not found (HTTP $MANIFEST_STATUS)${NC}"
fi

echo ""

# Check 2: Mini App HTML exists
echo "2️⃣  Checking Mini App HTML..."
MINIAPP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$MINIAPP_URL")

if [ "$MINIAPP_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✅ Mini App HTML accessible (HTTP 200)${NC}"

    # Download and check for meta tags
    MINIAPP_HTML=$(curl -s "$MINIAPP_URL")

    if echo "$MINIAPP_HTML" | grep -q 'fc:miniapp'; then
        echo -e "${GREEN}✅ fc:miniapp meta tag found${NC}"
    else
        echo -e "${RED}❌ fc:miniapp meta tag missing${NC}"
    fi

    if echo "$MINIAPP_HTML" | grep -q '@farcaster/miniapp-sdk'; then
        echo -e "${GREEN}✅ Farcaster SDK imported${NC}"
    else
        echo -e "${RED}❌ Farcaster SDK not found${NC}"
    fi

    if echo "$MINIAPP_HTML" | grep -q 'sdk.actions.ready'; then
        echo -e "${GREEN}✅ sdk.actions.ready() called${NC}"
    else
        echo -e "${RED}❌ sdk.actions.ready() not found${NC}"
    fi

    if echo "$MINIAPP_HTML" | grep -q 'getEthereumProvider'; then
        echo -e "${GREEN}✅ Ethereum provider access implemented${NC}"
    else
        echo -e "${RED}❌ Ethereum provider not found${NC}"
    fi
else
    echo -e "${RED}❌ Mini App HTML not found (HTTP $MINIAPP_STATUS)${NC}"
fi

echo ""

# Check 3: Assets
echo "3️⃣  Checking assets..."

# Check icon
ICON_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/icon-512.png")
if [ "$ICON_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✅ Icon accessible (HTTP 200)${NC}"
else
    echo -e "${YELLOW}⚠️  Icon not found (HTTP $ICON_STATUS)${NC}"
fi

# Check splash
SPLASH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/splash-1200x630.png")
if [ "$SPLASH_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✅ Splash image accessible (HTTP 200)${NC}"
else
    echo -e "${YELLOW}⚠️  Splash image not found (HTTP $SPLASH_STATUS)${NC}"
fi

# Check logo
LOGO_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/logo.png")
if [ "$LOGO_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✅ Logo accessible (HTTP 200)${NC}"
else
    echo -e "${YELLOW}⚠️  Logo not found (HTTP $LOGO_STATUS)${NC}"
fi

echo ""
echo "======================================"
echo "📋 Summary"
echo "======================================"
echo ""
echo "✅ = Working correctly"
echo "⚠️  = Warning (may impact functionality)"
echo "❌ = Error (will cause issues)"
echo ""
echo "Next Steps:"
echo "1. Fix any ❌ errors shown above"
echo "2. Deploy changes to production"
echo "3. Test in Farcaster app on mobile"
echo "4. Use Mini App Preview Tool:"
echo "   https://farcaster.xyz/~/developers/mini-apps/preview"
echo ""
echo "Preview URL:"
echo "https://farcaster.xyz/~/developers/mini-apps/preview?url=$(echo -n "$MINIAPP_URL" | jq -sRr @uri)"
echo ""
