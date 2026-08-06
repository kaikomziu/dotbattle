@echo off
chcp 65001 >nul
title ドットバトル - マルチプレイサーバー
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 goto :no_node

where npm >nul 2>nul
if errorlevel 1 goto :no_npm

if exist "node_modules" goto :start_server

echo 初回起動のため、必要なパッケージをインストールします...
call npm install
if errorlevel 1 goto :install_failed
echo.

:start_server
echo サーバーを起動します...
echo 終了するにはこのウィンドウを閉じるか Ctrl+C を押してください。
echo.
call npm start

echo.
echo サーバーが停止しました。
pause
exit /b 0

:no_node
echo Node.js がインストールされていないか、PATHが通っていません。
echo https://nodejs.org/ からNode.jsをインストールしてから、もう一度お試しください。
pause
exit /b 1

:no_npm
echo npm が見つかりませんでした。Node.jsを再インストールしてください。
pause
exit /b 1

:install_failed
echo.
echo パッケージのインストールに失敗しました。
pause
exit /b 1
