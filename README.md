# Liner CSS

## CSS の編集と最適化

- 編集用のCSSは `css/edit/` にあります。通常の変更はここで行います。
- `css/optimized/` には Lightning CSS で最小化したファイルを置きます。HTML はこちらを読み込みます。
- `css/edit/old.css` は旧スタイルの参照用です。最適化コマンドの対象には含めません。

初回のみ、Cargo から Lightning CSS CLI をインストールします。`cli` feature を有効にすると `lightningcss` コマンドが使えます。

```sh
cargo install lightningcss --version 1.0.0-alpha.72 --features cli --locked
```

編集後はプロジェクトのルートで次のコマンドを実行し、最適化済みファイルを更新します。

```sh
lightningcss --minify css/edit/style.css --output-file css/optimized/style.css
lightningcss --minify css/edit/layout.css --output-file css/optimized/layout.css
lightningcss --minify css/edit/ui.css --output-file css/optimized/ui.css
```

### 最適化オプション

- `--minify` はCSSを圧縮し、値の短縮や隣接ルールの統合などを行います。
- `--targets "<Browserslist query>"` を付けると、指定した対応ブラウザーに合わせて構文変換やベンダープレフィックスを調整できます。
- `--bundle` は CSS の `@import` をまとめるオプションです。このプロジェクトは3ファイルを別々に読み込むため使いません。

## アイデア

- ロード時にボーダー色を `--color-accent-2` に一瞬だけする。
