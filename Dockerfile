# ベースイメージの指定
FROM node:lts-alpine3.20

# 必要なパッケージをインストール
RUN apk add --no-cache git

# 作業ディレクトリを設定
WORKDIR /usr/app

# package.json と yarn.lock のコピー
COPY package.json yarn.lock ./

# 依存関係のインストール
RUN yarn install --frozen-lockfile --ignore-optional

# アプリケーションコードをコピー
COPY . .

# 開発サーバーの起動
CMD ["yarn", "start"]
