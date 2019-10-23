import { expect } from 'chai';
import * as mocha from 'mocha';
import * as fs from 'mz/fs';
import * as temp from 'temp';

import { getTestFile } from '../files';
import { getKubernetesAccess } from '../../src/lib/kubernetes';

describe('Kubernetes Integration', () => {
	before(async function() {
		this.kubeConfig = temp.track().path();
		await fs.writeFile(this.kubeConfig, process.env.KATAPULT_KUBE_CONFIG || '');
	});

	after(async function() {
		await (await getKubernetesAccess()).begin(async function(client) {
			try {
				await client.api.v1.namespaces('test-namespace').delete();
			} catch {}
		});

		temp.cleanupSync();
	});

	it('Should remove the temporary kubeconfig file when the context is complete', async function() {
		let kubeconfig = '';

		const access = await getKubernetesAccess();
		await access.begin(async function() {
			kubeconfig = this.accessConfig.kubeconfig;
			const exists = await fs.exists(kubeconfig);
			expect(exists).equals(true);
		});

		expect(!(await fs.exists(kubeconfig))).equals(false);
	});

	it('Should connect directly to the Kind cluster', async function() {
		await (await getKubernetesAccess()).begin(async function(client) {
			const nodes = await client.api.v1.nodes.get();
			expect(nodes).to.be.an('object');
			expect(nodes).to.have.property('statusCode', 200);

			expect(nodes).to.have.property('body');
			expect(nodes.body)
				.to.have.property('items')
				.that.is.an('array')
				.with.lengthOf(1);
		});
	});

	it('Should connect directly to the Kind cluster (kubeconfig as path)', async function() {
		const kubeconfig = process.env.KATAPULT_KUBE_CONFIG;
		process.env.KATAPULT_KUBE_CONFIG = this.kubeConfig;

		await (await getKubernetesAccess()).begin(async function(client) {
			const nodes = await client.api.v1.nodes.get();
			expect(nodes).to.be.an('object');
			expect(nodes).to.have.property('statusCode', 200);

			expect(nodes).to.have.property('body');
			expect(nodes.body)
				.to.have.property('items')
				.that.is.an('array')
				.with.lengthOf(1);
		});

		process.env.KATAPULT_KUBE_CONFIG = kubeconfig;
	});

	it('Should connect via a bastion to the Kind cluster (no passphrase)', async function() {
		process.env.KATAPULT_KUBE_BASTION_HOST = '127.0.0.1';
		process.env.KATAPULT_KUBE_BASTION_PORT = '2222';
		process.env.KATAPULT_KUBE_BASTION_API_HOST = 'localhost';
		process.env.KATAPULT_KUBE_BASTION_API_PORT = '8443';
		process.env.KATAPULT_KUBE_BASTION_USER = 'root';
		process.env.KATAPULT_KUBE_BASTION_KEY = (await fs.readFile(
			await getTestFile('../scripts/bastion-id-without-passphrase'),
		)).toString('base64');

		await (await getKubernetesAccess()).begin(async function(client) {
			const kubeconfig = JSON.stringify(this.kubeconfig, null, 2);
			expect(kubeconfig).not.contains('https://localhost:8443/');
			expect(kubeconfig).contains('insecure-skip-tls-verify');

			const nodes = await client.api.v1.nodes.get();
			expect(nodes).to.be.an('object');
			expect(nodes).to.have.property('statusCode', 200);

			expect(nodes).to.have.property('body');
			expect(nodes.body)
				.to.have.property('items')
				.that.is.an('array')
				.with.lengthOf(1);
		});

		delete process.env['KATAPULT_KUBE_BASTION_HOST'];
		delete process.env['KATAPULT_KUBE_BASTION_PORT'];
		delete process.env['KATAPULT_KUBE_BASTION_API_HOST'];
		delete process.env['KATAPULT_KUBE_BASTION_API_PORT'];
		delete process.env['KATAPULT_KUBE_BASTION_USER'];
		delete process.env['KATAPULT_KUBE_BASTION_KEY'];
	});

	it('Should connect via a bastion to the Kind cluster (with passphrase)', async function() {
		process.env.KATAPULT_KUBE_BASTION_HOST = '127.0.0.1';
		process.env.KATAPULT_KUBE_BASTION_PORT = '2222';
		process.env.KATAPULT_KUBE_BASTION_API_HOST = 'localhost';
		process.env.KATAPULT_KUBE_BASTION_API_PORT = '8443';
		process.env.KATAPULT_KUBE_BASTION_USER = 'root';
		process.env.KATAPULT_KUBE_BASTION_KEY = (await fs.readFile(
			await getTestFile('../scripts/bastion-id-with-passphrase'),
		)).toString('base64');
		process.env.KATAPULT_KUBE_BASTION_KEY_PASSPHRASE = 'SuperSecret01';

		await (await getKubernetesAccess()).begin(async function(client) {
			const nodes = await client.api.v1.nodes.get();
			expect(nodes).to.be.an('object');
			expect(nodes).to.have.property('statusCode', 200);

			expect(nodes).to.have.property('body');
			expect(nodes.body)
				.to.have.property('items')
				.that.is.an('array')
				.with.lengthOf(1);
		});

		delete process.env['KATAPULT_KUBE_BASTION_HOST'];
		delete process.env['KATAPULT_KUBE_BASTION_PORT'];
		delete process.env['KATAPULT_KUBE_BASTION_API_HOST'];
		delete process.env['KATAPULT_KUBE_BASTION_API_PORT'];
		delete process.env['KATAPULT_KUBE_BASTION_USER'];
		delete process.env['KATAPULT_KUBE_BASTION_KEY'];
		delete process.env['KATAPULT_KUBE_BASTION_KEY_PASSPHRASE'];
	});

	it('Should create a new namespace', async function() {
		await (await getKubernetesAccess()).begin(async function(client) {
			const body = {
				apiVersion: 'v1',
				kind: 'Namespace',
				metadata: {
					name: 'test-namespace',
				},
				labels: {
					name: 'test-namespace',
				},
			};
			await client.api.v1.namespace.post({ body });

			const namespaces = await client.api.v1.namespaces.get();
			expect(namespaces).to.be.an('object');
			expect(namespaces.body.items).to.be.an('array');

			const filteredNamespaces = (namespaces.body.items as Array<any>).filter(
				i => i.metadata.name === 'test-namespace',
			);
			expect(filteredNamespaces).to.have.lengthOf(1);
		});
	});
});
