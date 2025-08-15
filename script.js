class ImageProcessor {
    constructor() {
        this.initializeEventListeners();
        this.setupTabNavigation();
    }

    initializeEventListeners() {
        // Resize tool
        this.setupFileUpload('resize-upload', 'resize-files', this.handleResizeFiles.bind(this));
        document.getElementById('resize-process').addEventListener('click', this.processResize.bind(this));
        document.getElementById('keep-aspect').addEventListener('change', this.toggleAspectRatio.bind(this));
        document.getElementById('resize-width').addEventListener('input', this.updateDimensions.bind(this));
        document.getElementById('resize-height').addEventListener('input', this.updateDimensions.bind(this));

        // Convert tool
        this.setupFileUpload('convert-upload', 'convert-files', this.handleConvertFiles.bind(this));
        document.getElementById('convert-process').addEventListener('click', this.processConvert.bind(this));
        document.getElementById('convert-format').addEventListener('change', this.toggleQualityOption.bind(this));
        document.getElementById('convert-quality').addEventListener('input', this.updateQualityValue.bind(this));

        // Icon tool
        this.setupFileUpload('icon-upload', 'icon-files', this.handleIconFiles.bind(this));
        document.getElementById('icon-process').addEventListener('click', this.processIcon.bind(this));
        document.getElementById('icon-type').addEventListener('change', this.toggleCustomSize.bind(this));
    }

    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                
                // Switch active tab and content
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                button.classList.add('active');
                document.getElementById(tabId).classList.add('active');
            });
        });
    }

    setupFileUpload(uploadAreaId, fileInputId, handler) {
        const uploadArea = document.getElementById(uploadAreaId);
        const fileInput = document.getElementById(fileInputId);

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadArea.addEventListener('drop', (e) => this.handleDrop(e, handler));
        fileInput.addEventListener('change', (e) => handler(e.target.files));
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
    }

    handleDrop(e, handler) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        handler(e.dataTransfer.files);
    }

    // Resize functionality
    handleResizeFiles(files) {
        if (files.length === 0) return;
        
        this.resizeFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        if (this.resizeFiles.length === 0) {
            alert('Please select image files.');
            return;
        }

        document.getElementById('resize-options').style.display = 'block';
        
        // Get and set the original size of the first image
        const firstFile = this.resizeFiles[0];
        const img = new Image();
        img.onload = () => {
            document.getElementById('resize-width').value = img.width;
            document.getElementById('resize-height').value = img.height;
            this.originalWidth = img.width;
            this.originalHeight = img.height;
            this.aspectRatio = img.width / img.height;
        };
        img.src = URL.createObjectURL(firstFile);
    }

    toggleAspectRatio() {
        const keepAspect = document.getElementById('keep-aspect').checked;
        if (keepAspect) {
            this.updateDimensions();
        }
    }

    updateDimensions() {
        const keepAspect = document.getElementById('keep-aspect').checked;
        if (!keepAspect || !this.aspectRatio) return;

        const width = document.getElementById('resize-width').value;
        const height = document.getElementById('resize-height').value;

        if (event.target.id === 'resize-width') {
            document.getElementById('resize-height').value = Math.round(width / this.aspectRatio);
        } else if (event.target.id === 'resize-height') {
            document.getElementById('resize-width').value = Math.round(height * this.aspectRatio);
        }
    }

    async processResize() {
        if (!this.resizeFiles || this.resizeFiles.length === 0) return;

        const width = parseInt(document.getElementById('resize-width').value);
        const height = parseInt(document.getElementById('resize-height').value);
        
        if (!width || !height || width <= 0 || height <= 0) {
            alert('Please enter valid dimensions.');
            return;
        }

        const resultsArea = document.getElementById('resize-results');
        resultsArea.innerHTML = '';

        const processBtn = document.getElementById('resize-process');
        processBtn.disabled = true;
        processBtn.textContent = 'Processing...';

        for (let i = 0; i < this.resizeFiles.length; i++) {
            const file = this.resizeFiles[i];
            try {
                const resizedFile = await this.resizeImage(file, width, height);
                this.createResultItem(resultsArea, resizedFile, file.name, `${width}x${height}`);
            } catch (error) {
                console.error('Resize error:', error);
            }
        }

        processBtn.disabled = false;
        processBtn.textContent = 'Resize Images';
    }

    async resizeImage(file, width, height) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, file.type, 0.9);
            };

            img.src = URL.createObjectURL(file);
        });
    }

    // Convert functionality
    handleConvertFiles(files) {
        if (files.length === 0) return;
        
        this.convertFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        if (this.convertFiles.length === 0) {
            alert('Please select image files.');
            return;
        }

        document.getElementById('convert-options').style.display = 'block';
        this.toggleQualityOption();
    }

    toggleQualityOption() {
        const format = document.getElementById('convert-format').value;
        const qualityGroup = document.getElementById('quality-group');
        qualityGroup.style.display = format === 'png' ? 'none' : 'flex';
    }

    updateQualityValue() {
        const quality = document.getElementById('convert-quality').value;
        document.getElementById('quality-value').textContent = quality;
    }

    async processConvert() {
        if (!this.convertFiles || this.convertFiles.length === 0) return;

        const format = document.getElementById('convert-format').value;
        const quality = parseInt(document.getElementById('convert-quality').value) / 100;

        const resultsArea = document.getElementById('convert-results');
        resultsArea.innerHTML = '';

        const processBtn = document.getElementById('convert-process');
        processBtn.disabled = true;
        processBtn.textContent = 'Converting...';

        for (let i = 0; i < this.convertFiles.length; i++) {
            const file = this.convertFiles[i];
            try {
                const convertedFile = await this.convertImage(file, format, quality);
                const newName = this.changeFileExtension(file.name, format);
                this.createResultItem(resultsArea, convertedFile, newName, format.toUpperCase());
            } catch (error) {
                console.error('Conversion error:', error);
            }
        }

        processBtn.disabled = false;
        processBtn.textContent = 'Convert Images';
    }

    async convertImage(file, format, quality) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                const mimeType = this.getMimeType(format);
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, mimeType, quality);
            };

            img.src = URL.createObjectURL(file);
        });
    }

    getMimeType(format) {
        const mimeTypes = {
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'webp': 'image/webp'
        };
        return mimeTypes[format] || 'image/jpeg';
    }

    changeFileExtension(filename, newExtension) {
        const lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex === -1) return filename + '.' + newExtension;
        return filename.substring(0, lastDotIndex) + '.' + newExtension;
    }

    // Icon functionality
    handleIconFiles(files) {
        if (files.length === 0) return;
        
        const file = files[0];
        if (!file.type.startsWith('image/')) {
            alert('Please select image files.');
            return;
        }

        this.iconFile = file;
        document.getElementById('icon-options').style.display = 'block';
    }

    toggleCustomSize() {
        const iconType = document.getElementById('icon-type').value;
        const customSize = document.getElementById('custom-size');
        customSize.style.display = iconType === 'custom' ? 'flex' : 'none';
    }

    async processIcon() {
        if (!this.iconFile) return;

        const iconType = document.getElementById('icon-type').value;
        const resultsArea = document.getElementById('icon-results');
        resultsArea.innerHTML = '';

        const processBtn = document.getElementById('icon-process');
        processBtn.disabled = true;
        processBtn.textContent = 'Generating...';

        const sizes = this.getIconSizes(iconType);

        for (const size of sizes) {
            try {
                const iconBlob = await this.createSocialImage(this.iconFile, size, iconType);
                const fileName = `${this.getIconFileName(iconType, size)}.png`;
                this.createResultItem(resultsArea, iconBlob, fileName, `${size[0]}x${size[1]}`);
            } catch (error) {
                console.error('Image generation error:', error);
            }
        }

        processBtn.disabled = false;
        processBtn.textContent = 'Generate Images';
    }

    getIconSizes(iconType) {
        const sizeMap = {
            // Website icons
            'favicon': [[16, 16], [32, 32], [48, 48]],
            'apple': [[180, 180]],
            'android': [[192, 192]],
            
            // YouTube
            'youtube-profile': [[800, 800]],
            'youtube-channel': [[2560, 1440]],
            'youtube-thumbnail': [[1280, 720]],
            'youtube-community': [[1200, 675]],
            
            // Twitter/X
            'twitter-profile': [[400, 400]],
            'twitter-header': [[1500, 500]],
            
            // Facebook
            'facebook-profile': [[170, 170]],
            'facebook-cover': [[820, 312]],
            'facebook-post': [[1200, 630]],
            
            // Instagram
            'instagram-profile': [[320, 320]],
            'instagram-story': [[1080, 1920]],
            'instagram-post': [[1080, 1080]],
            'instagram-reels': [[1080, 1920]],
            
            // LinkedIn
            'linkedin-profile': [[400, 400]],
            'linkedin-cover': [[1584, 396]],
            'linkedin-post': [[1200, 627]],
            
            // Discord
            'discord-server': [[512, 512]],
            'discord-banner': [[960, 540]],
            
            // Twitch
            'twitch-profile': [[256, 256]],
            'twitch-banner': [[1920, 480]],
            'twitch-offline': [[1920, 1080]],
            
            // TikTok
            'tiktok-profile': [[200, 200]],
            
            // Custom
            'custom': [[parseInt(document.getElementById('icon-size').value) || 256, parseInt(document.getElementById('icon-size').value) || 256]]
        };
        return sizeMap[iconType] || [[256, 256]];
    }

    getIconFileName(iconType, size) {
        const fileNames = {
            // Website icons
            'favicon': `favicon_${size[0]}x${size[1]}`,
            'apple': 'apple-touch-icon',
            'android': 'android-icon',
            
            // YouTube
            'youtube-profile': 'youtube_profile_image',
            'youtube-channel': 'youtube_channel_art',
            'youtube-thumbnail': 'youtube_thumbnail',
            'youtube-community': 'youtube_community_post',
            
            // Twitter/X
            'twitter-profile': 'twitter_profile_image',
            'twitter-header': 'twitter_header_image',
            
            // Facebook
            'facebook-profile': 'facebook_profile_picture',
            'facebook-cover': 'facebook_cover_photo',
            'facebook-post': 'facebook_post_image',
            
            // Instagram
            'instagram-profile': 'instagram_profile_picture',
            'instagram-story': 'instagram_story',
            'instagram-post': 'instagram_post',
            'instagram-reels': 'instagram_reels',
            
            // LinkedIn
            'linkedin-profile': 'linkedin_profile_photo',
            'linkedin-cover': 'linkedin_cover_photo',
            'linkedin-post': 'linkedin_post_image',
            
            // Discord
            'discord-server': 'discord_server_icon',
            'discord-banner': 'discord_server_banner',
            
            // Twitch
            'twitch-profile': 'twitch_profile_image',
            'twitch-banner': 'twitch_banner',
            'twitch-offline': 'twitch_offline_screen',
            
            // TikTok
            'tiktok-profile': 'tiktok_profile_picture',
            
            // Custom
            'custom': `custom_${size[0]}x${size[1]}`
        };
        return fileNames[iconType] || `image_${size[0]}x${size[1]}`;
    }

    async createSocialImage(file, size, iconType) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                canvas.width = size[0];
                canvas.height = size[1];
                
                // Fill background with white (to avoid transparent background)
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Determine drawing method based on aspect ratio
                const targetRatio = size[0] / size[1];
                const sourceRatio = img.width / img.height;
                
                let drawWidth, drawHeight, sx, sy, sWidth, sHeight;
                
                if (this.isSquareImage(iconType)) {
                    // For square images: crop the center portion to square
                    const minDimension = Math.min(img.width, img.height);
                    sx = (img.width - minDimension) / 2;
                    sy = (img.height - minDimension) / 2;
                    sWidth = minDimension;
                    sHeight = minDimension;
                    drawWidth = size[0];
                    drawHeight = size[1];
                } else if (targetRatio > sourceRatio) {
                    // If target is wider: fit to width
                    drawWidth = size[0];
                    drawHeight = size[0] / sourceRatio;
                    sx = 0;
                    sy = 0;
                    sWidth = img.width;
                    sHeight = img.height;
                } else {
                    // If target is taller: fit to height
                    drawWidth = size[1] * sourceRatio;
                    drawHeight = size[1];
                    sx = 0;
                    sy = 0;
                    sWidth = img.width;
                    sHeight = img.height;
                }
                
                // Center the image
                const dx = (size[0] - drawWidth) / 2;
                const dy = (size[1] - drawHeight) / 2;
                
                ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, drawWidth, drawHeight);
                
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/png', 0.95);
            };

            img.src = URL.createObjectURL(file);
        });
    }

    // Determine if the image should be square
    isSquareImage(iconType) {
        const squareTypes = [
            'favicon', 'apple', 'android',
            'youtube-profile', 'twitter-profile', 'facebook-profile',
            'instagram-profile', 'instagram-post', 'linkedin-profile',
            'discord-server', 'twitch-profile', 'tiktok-profile'
        ];
        return squareTypes.includes(iconType);
    }

    // Display results
    createResultItem(container, blob, fileName, info) {
        const item = document.createElement('div');
        item.className = 'result-item';

        const img = document.createElement('img');
        img.src = URL.createObjectURL(blob);
        
        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-info';
        fileInfo.textContent = `${fileName} (${info})`;

        const downloadBtn = document.createElement('a');
        downloadBtn.className = 'download-btn';
        downloadBtn.textContent = 'Download';
        downloadBtn.href = URL.createObjectURL(blob);
        downloadBtn.download = fileName;

        item.appendChild(img);
        item.appendChild(fileInfo);
        item.appendChild(downloadBtn);
        container.appendChild(item);
    }
}

// Application initialization
document.addEventListener('DOMContentLoaded', () => {
    new ImageProcessor();
});