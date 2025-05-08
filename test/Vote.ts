import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { ethers } from "ethers";
import { buildBabyjub, Point } from "circomlibjs";
import { Prover, Voter, SubmitPublicKey, Decrypt } from "../component/prover";
import { toBytes, fromBytes, NonceTooLowError } from 'viem'
import { getPublicKey } from "../component/util";

describe("Verifier", function () {
  async function deployFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.viem.getWalletClients();

    const voteVerifier = await hre.viem.deployContract("contracts/circuit/vote_verifier.sol:Groth16Verifier", [], {});
    const publicKeyVerifier = await hre.viem.deployContract("contracts/circuit/publickey_verifier.sol:Groth16Verifier", [], {});
    const decryptVerifier = await hre.viem.deployContract("contracts/circuit/decrypt_verifier.sol:Groth16Verifier", [], {});
    const avote = await hre.viem.deployContract("Voter", [voteVerifier.address, publicKeyVerifier.address, decryptVerifier.address], {});

    const publicClient = await hre.viem.getPublicClient();
    const curve = await buildBabyjub();

    const counterPrivates: bigint[] = [
      5111791321839995612998814389345637054499093359564416875491757815117927907641n,
      8210300147052601658608945551383277467688394719712126374785156317380012298333n,
      10253883521808019204853708370069688980921908910512304424237432623098941967830n
    ]

    return { curve, avote, counterPrivates, owner, otherAccount, publicClient };
  }


  it("Should create the right vote", async function () {
    const fixture = await loadFixture(deployFixture);
    const q: Point = [
      fixture.curve.F.e(6489233788378067156625360882254692676403364745716042922116521603143735061267n.toString()),
      fixture.curve.F.e(17132753835983889203352161387954887095197438983554319845530141758920198055007n.toString()),
    ];  // public key
    const v = 3;  // vote value

    let prover: Prover = new Voter();
    const proof = await prover.prove({
      publicKey: q,
      value: v,
    }, 4);

    const rsp = await fixture.avote.write.Vote(proof);

    await fixture.publicClient.waitForTransactionReceipt({hash: rsp});
    const voteEvents = await fixture.avote.getEvents.VoteLog();
    expect(voteEvents).to.have.lengthOf(1);
  })

  it("Should add the right public key", async function() {
    const fixture = await loadFixture(deployFixture);
    const privateKey: bigint = randomOrder(fixture.curve.order);
    let prover: Prover = new SubmitPublicKey();
    const proof = await prover.prove({
        privateKey: privateKey,
    }, 2);

    const rsp = await fixture.avote.write.SubmitPublicKey(proof);

    await fixture.publicClient.waitForTransactionReceipt({hash: rsp});
    const voteEvents = await fixture.avote.getEvents.SubmitPublicKeyLog();
    expect(voteEvents).to.have.lengthOf(1);
  })

  it("Should add the right multi-public key", async function () {
    const fixture = await loadFixture(deployFixture);

    let prover: Prover = new SubmitPublicKey();
    for (let i = 0; i < fixture.counterPrivates.length; i++) {
      const proof = await prover.prove({
        privateKey: fixture.counterPrivates[i],
      }, 2);
      let now = new Date();
      const rsp = await fixture.avote.write.SubmitPublicKey(proof);
      console.log(new Date().getTime() - now.getTime())
      await fixture.publicClient.waitForTransactionReceipt({hash: rsp});
      const voteEvents = await fixture.avote.getEvents.SubmitPublicKeyLog();
      expect(voteEvents).to.have.lengthOf(1);
    }

    const publicKeys = await fixture.avote.read.PublicKeys()
    let publicKeyPoints: Point[] = [];
    for (let i = 0; i < publicKeys.length; i++) {
      publicKeyPoints.push([
        fixture.curve.F.e(publicKeys[i].x.toString()),
        fixture.curve.F.e(publicKeys[i].y.toString()),
      ])
    }
    const publicKey = await getPublicKey(publicKeyPoints);

    expect(publicKey).to.deep.equals(
      [
        fixture.curve.F.e(10981563598801205623359592314677833300087079990999938873324121769192133307962n.toString()),
        fixture.curve.F.e(6300402212863780602412389550578979668773005062754014312139548457863915860054n.toString()),
      ],
    );
  })

  it("Should add the right decryption", async function() {
    const fixture = await loadFixture(deployFixture);
    const privateKey: bigint = randomOrder(fixture.curve.order);
    const publicKey: Point = fixture.curve.mulPointEscalar(fixture.curve.Base8, privateKey);
    const k: bigint = randomOrder(fixture.curve.order);
    const c1: Point = fixture.curve.mulPointEscalar(fixture.curve.Base8, k);

    let prover: Prover = new Decrypt();
    const proof = await prover.prove({
      privateKey: privateKey,
      publicKey: publicKey,
      c1: c1,
    }, 6);

    const rsp = await fixture.avote.write.Decrypt(proof);

    await fixture.publicClient.waitForTransactionReceipt({hash: rsp});
    const voteEvents = await fixture.avote.getEvents.DecryptLog();
    expect(voteEvents).to.have.lengthOf(1);

    let dMulC1 = fixture.curve.mulPointEscalar(c1, privateKey);
    expect(voteEvents[0].args).to.deep.equals( [{
      dMulC1: {
        x: ethers.toBigInt(fixture.curve.F.toString(dMulC1[0])),
        y: ethers.toBigInt(fixture.curve.F.toString(dMulC1[1])),
      },
    }]);
  })

});

function randomOrder(modular: bigint): bigint {
  return ethers.toBigInt(ethers.randomBytes(32)) % modular;
}