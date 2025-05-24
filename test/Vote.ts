import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { ethers, toBigInt } from "ethers";
import { buildBabyjub, Point, BabyJub } from "circomlibjs";
import { Prover, Voter, SubmitPublicKey, Decrypt, CheckSum } from "../component/prover";
import { toBytes, fromBytes, NonceTooLowError, createPublicClient, createTestClient, http, walletActions } from 'viem'
import { sumPoints, BigPoint, Cipher, toPoint, sumBigPoints, decode, toBigPoint, randomScalar, Proof} from "../component/util";
import * as fixtureTest from "./fixture"
import { bigint } from "hardhat/internal/core/params/argumentTypes";

describe("Verifier", function () {
  it("Should initiate a vote successfully", async function () {
    const fixture = await loadFixture(fixtureTest.deployFixture);
    let initiatedRsp = await fixture.accounts[4].writeContract({
      address: fixture.avote.address,
      abi: fixture.avote.abi,
      functionName: 'Initiate',
      args: [[
        fixture.accounts[5].account.address,
        fixture.accounts[6].account.address,
        fixture.accounts[7].account.address,
        fixture.accounts[8].account.address,
        fixture.accounts[9].account.address,
      ], fixture.voteId, 3n],
      value: 1n
    })
    await fixture.publicClient.waitForTransactionReceipt({hash: initiatedRsp});
    const event = await fixture.avote.getEvents.InitiateLog();
    expect(event).to.have.lengthOf(1);
    expect(await fixture.avote.read.GetVoteInfo([fixture.voteId])).to.be.deep.equals(fixtureTest.InitiatedStateStart());
  })

  it("Should change the state to voting successfully", async function () {
    const fixture = await loadFixture(fixtureTest.deployFixture);
    await fixture.avote.write.SetTestState([fixture.voteId, fixtureTest.InitiatedStateEnd()]);

    let proofs: Proof[] = [];
    let windowSums: BigPoint[] = [];

    let lastSum: BigPoint = {x: 0n, y: 1n};
    let keys = fixtureTest.InitiatedStateEnd().counterPublicKeys;
    let sumPoint = toPoint(fixture.curve, lastSum);
    const windowSize = 32;
    for (let i = 0; i < Math.floor((keys.length - 1) / (windowSize-1)) + 1; i++) {
      let points: BigPoint[] = [];
      for (let j = 0; j < (windowSize-1); j++) {
        if (i*(windowSize-1)+j >= keys.length) {
          points.push({
            x: 0n,
            y: 1n,
          });
        } else {
          points.push({
            x: keys[i*(windowSize-1) + j].x,
            y: keys[i*(windowSize-1) + j].y
          });
        }
        sumPoint = fixture.curve.addPoint(sumPoint, toPoint(fixture.curve, points[j]));
      }

      let outSum: BigPoint = toBigPoint(fixture.curve, sumPoint);
      let prover = new CheckSum();
      const proof = await prover.prove({
        lastSum: lastSum,
        points: points,
        outSum: outSum,
      });

      proofs.push({
        a: proof[0],
        b: proof[1],
        c: proof[2],
      })
      windowSums.push({
        x: outSum.x,
        y: outSum.y,
      })
      lastSum = toBigPoint(fixture.curve, sumPoint);
    }
    let rsp = await fixture.avote.write.ChangeStateToVoting([fixture.voteId, proofs, windowSums]);    
    await fixture.publicClient.waitForTransactionReceipt({hash: rsp});
    const event = await fixture.avote.getEvents.ChangeStateLog();
    expect(event).to.have.lengthOf(1);
    expect(await fixture.avote.read.GetVoteInfo([fixture.voteId])).to.be.deep.equals(fixtureTest.VotingStateStart());
  })

  it("Should submit the right votes", async () => {
    const fixture = await loadFixture(fixtureTest.deployFixture);
    await fixture.avote.write.SetTestState([fixture.voteId, fixtureTest.VotingStateStart()]);
    for (let i in fixture.voterPrivates) {
      let prover = new Voter(fixture.voterPrivates[i].randomK);
      const proof = await prover.prove({
        publicKey: fixture.expectPublicKey,
        value: fixture.voterPrivates[i].value,
      });  
      const rsp = await fixture.avote.write.Vote([fixture.voteId, ...proof]);
      await fixture.publicClient.waitForTransactionReceipt({hash: rsp});
      const voteEvents = await fixture.avote.getEvents.VoteLog();
      expect(voteEvents).to.have.lengthOf(1);
      expect(voteEvents[0].args[0]?.cipher.c1).to.deep.equals(fixture.voterPrivates[i].c1);
      expect(voteEvents[0].args[0]?.cipher.c2).to.deep.equals(fixture.voterPrivates[i].c2);
    }
    expect(await fixture.avote.read.GetVoteInfo([fixture.voteId])).to.be.deep.equals(fixtureTest.VotingStateEnd());
  })

  it("Should add the right votes", async () => {
    const fixture = await loadFixture(fixtureTest.deployFixture);
    await fixture.avote.write.SetTestState([fixture.voteId, fixtureTest.VotingStateStart()]);

    // test the event
    for (let i in fixture.voterPrivates) {
      let prover = new Voter(fixture.voterPrivates[i].randomK);
      const proof = await prover.prove({
        publicKey: fixture.expectPublicKey,
        value: fixture.voterPrivates[i].value,
      });  
      const rsp = await fixture.avote.write.Vote([fixture.voteId, ...proof]);
      await fixture.publicClient.waitForTransactionReceipt({hash: rsp});
      const voteEvents = await fixture.avote.getEvents.VoteLog();
      expect(voteEvents).to.have.lengthOf(1);
      expect(voteEvents[0].args[0]?.cipher.c1).to.deep.equals(fixture.voterPrivates[i].c1);
      expect(voteEvents[0].args[0]?.cipher.c2).to.deep.equals(fixture.voterPrivates[i].c2);
    }
    // test the contract storage
    let voteInfo = await fixture.avote.read.GetVoteInfo([fixture.voteId]);
    expect(voteInfo.votes).to.have.lengthOf(fixture.voterPrivates.length);
    for (let i in fixture.voterPrivates) {
      expect(voteInfo.votes[i].cipher.c1).to.deep.equals(fixture.voterPrivates[i].c1);
      expect(voteInfo.votes[i].cipher.c2).to.deep.equals(fixture.voterPrivates[i].c2);
    }

    // test the sum of c1 and the sum of c2
    const c1s: Point[] = [];
    const c2s: Point[] = [];
    for (let i in fixture.voterPrivates) {
      c1s.push(toPoint(fixture.curve, fixture.voterPrivates[i].c1));
      c2s.push(toPoint(fixture.curve, fixture.voterPrivates[i].c2));
    }
    const sumCipher: Cipher = {
      c1: sumPoints(fixture.curve, c1s),
      c2: sumPoints(fixture.curve, c2s),
    }
    expect(sumCipher).to.deep.equals(fixture.sumCipher);

    // test decrypt for every counter
    for (let i in fixture.counterTestValues) {
      let prover = new Decrypt();
      const proof = await prover.prove({
        privateKey: fixture.counterTestValues[i].private,
        publicKey: fixture.curve.mulPointEscalar(fixture.curve.Base8, fixture.counterTestValues[i].private),
        c1: sumCipher.c1,
      });
      const rsp = await fixture.avote.write.Decrypt([fixture.voteId, ...proof]);

      await fixture.publicClient.waitForTransactionReceipt({hash: rsp});
      const decryptEvents = await fixture.avote.getEvents.DecryptLog();
      expect(decryptEvents).to.have.lengthOf(1);
    }

    voteInfo = await fixture.avote.read.GetVoteInfo([fixture.voteId]);
    expect(voteInfo.decryptPoints).to.have.lengthOf(fixture.counterTestValues.length);
    for (let i = 0; i < voteInfo.decryptPoints.length; i++) {
      expect(voteInfo.decryptPoints[i]).to.deep.equals(fixture.counterTestValues[i].dMulC1);
    }

    const sumDecrypt = sumBigPoints(fixture.curve, voteInfo.decryptPoints);
    expect(sumDecrypt).to.deep.equals(fixture.sumDecrypts);
    const plainPoint = decode(fixture.curve, sumDecrypt, toBigPoint(fixture.curve, sumCipher.c2));

    let expectPlain: Point = fixture.curve.mulPointEscalar(fixture.curve.Base8, 8);
    expect(plainPoint).to.deep.equals(toBigPoint(fixture.curve, expectPlain));

  })

  it("Should add the counter's public keys correctly", async function () {
    const fixture = await loadFixture(fixtureTest.deployFixture);
    await fixture.avote.write.SetTestState([fixture.voteId, fixtureTest.InitiatedStateStart()]);

    let prover = new SubmitPublicKey();
    for (let i = 0; i < fixture.counterTestValues.length; i++) {
      const proof = await prover.prove({
        privateKey: fixture.counterTestValues[i].private,
      });
      let cli = await hre.viem.getContractAt("Avote", fixture.avote.address, {
        client: { wallet: fixture.accounts[1]},
      })
      const rsp = await cli.write.SubmitPublicKey([fixture.voteId, ...proof]);
      await fixture.publicClient.waitForTransactionReceipt({hash: rsp});
      const voteEvents = await cli.getEvents.SubmitPublicKeyLog();
      expect(voteEvents).to.have.lengthOf(1);
    }

    const voteInfo = await fixture.avote.read.GetVoteInfo([fixture.voteId]);
    let publicKeyPoints: Point[] = [];
    for (let i = 0; i < voteInfo.counterPublicKeys.length; i++) {
      publicKeyPoints.push([
        fixture.curve.F.e(voteInfo.counterPublicKeys[i].x.toString()),
        fixture.curve.F.e(voteInfo.counterPublicKeys[i].y.toString()),
      ])
    }
    const publicKey = await sumPoints(fixture.curve, publicKeyPoints);
    expect(publicKey).to.deep.equals(fixture.expectPublicKey);
    expect(await fixture.avote.read.GetVoteInfo([fixture.voteId])).to.deep.equals(fixtureTest.InitiatedStateEnd());
  })

  it("Should add the right decryption", async function() {
    const fixture = await loadFixture(fixtureTest.deployFixture);
    const privateKey: bigint = randomScalar(fixture.curve);
    const publicKey: Point = fixture.curve.mulPointEscalar(fixture.curve.Base8, privateKey);
    const k: bigint = randomScalar(fixture.curve);
    const c1: Point = fixture.curve.mulPointEscalar(fixture.curve.Base8, k);

    let prover = new Decrypt();
    const proof = await prover.prove({
      privateKey: privateKey,
      publicKey: publicKey,
      c1: c1,
    });

    const rsp = await fixture.avote.write.Decrypt([fixture.voteId, ...proof]);

    await fixture.publicClient.waitForTransactionReceipt({hash: rsp});
    const voteEvents = await fixture.avote.getEvents.DecryptLog();
    expect(voteEvents).to.have.lengthOf(1);

    let dMulC1 = fixture.curve.mulPointEscalar(c1, privateKey);
    expect(voteEvents[0].args).to.deep.equals( [{
        x: ethers.toBigInt(fixture.curve.F.toString(dMulC1[0])),
        y: ethers.toBigInt(fixture.curve.F.toString(dMulC1[1])),
    }]);
  })

});

