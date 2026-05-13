const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const distMainFile = path.join(projectRoot, 'dist', 'main.js');

let appProcess = null;
let buildProcess = null;
let lastKnownMtime = 0;
let restartTimer = null;

const startApp = () => {
	if (!fs.existsSync(distMainFile)) {
		return;
	}

	if (appProcess) {
		appProcess.kill();
	}

	appProcess = spawn(process.execPath, [distMainFile], {
		cwd: projectRoot,
		stdio: 'inherit',
		shell: false,
		env: process.env,
	});

	appProcess.on('exit', (code, signal) => {
		if (code !== 0 && signal !== 'SIGTERM') {
			console.log(`[dev] App exited with code ${code ?? 'null'}`);
		}
	});
};

const scheduleRestart = () => {
	clearTimeout(restartTimer);
	restartTimer = setTimeout(() => {
		try {
			const stat = fs.statSync(distMainFile);
			if (stat.mtimeMs !== lastKnownMtime) {
				lastKnownMtime = stat.mtimeMs;
				startApp();
			}
		} catch (error) {
			// Si el archivo aún no existe, esperamos al siguiente build.
		}
	}, 300);
};

const watchCompiledFile = () => {
	fs.watchFile(distMainFile, { interval: 500 }, (current, previous) => {
		if (current.mtimeMs === 0) {
			return;
		}

		if (current.mtimeMs !== previous.mtimeMs) {
			lastKnownMtime = current.mtimeMs;
			scheduleRestart();
		}
	});
};

const startBuildWatcher = () => {
	buildProcess = spawn('npm', ['run', 'build', '--', '--watch'], {
		cwd: projectRoot,
		shell: true,
		stdio: 'inherit',
		env: process.env,
	});

	buildProcess.on('exit', (code) => {
		if (appProcess) {
			appProcess.kill();
		}
		process.exit(code ?? 0);
	});
};

const runInitialBuild = () => {
	const result = spawnSync('npm', ['run', 'build'], {
		cwd: projectRoot,
		shell: true,
		stdio: 'inherit',
		env: process.env,
	});

	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
};

process.on('SIGINT', () => {
	if (buildProcess) {
		buildProcess.kill();
	}
	if (appProcess) {
		appProcess.kill();
	}
	process.exit(0);
});

process.on('SIGTERM', () => {
	if (buildProcess) {
		buildProcess.kill();
	}
	if (appProcess) {
		appProcess.kill();
	}
	process.exit(0);
});

watchCompiledFile();
runInitialBuild();

try {
	const stat = fs.statSync(distMainFile);
	lastKnownMtime = stat.mtimeMs;
} catch (error) {
	lastKnownMtime = 0;
}

startApp();
startBuildWatcher();