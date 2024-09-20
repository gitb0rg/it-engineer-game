// webpack.config.js

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './src/main.js', // Точка входа
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true, // Очистка папки dist перед сборкой
        publicPath: './', // Обеспечивает корректные пути к ассетам
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader', // Транспиляция кода
                    options: {
                        presets: ['@babel/preset-env'],
                    },
                },
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'], // Обработка CSS
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource', // Обработка изображений
                generator: {
                    filename: 'assets/images/[name][ext]', // Путь сохранения изображений
                },
            },
            {
                test: /\.(mp3|wav)$/i,
                type: 'asset/resource', // Обработка аудио
                generator: {
                    filename: 'assets/audio/[name][ext]', // Путь сохранения аудио
                },
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './public/index.html', // Шаблон HTML
        }),
    ],
    devServer: {
        static: './dist',
        hot: true, // Горячая перезагрузка
    },
    resolve: {
        extensions: ['.js'],
    },
};