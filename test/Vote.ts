import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import * as Util from "../component/util"
import * as Prover from "../component/prover"
import * as fixtureTest from "./fixture"
import { buildBabyjub } from "circomlibjs";
import { Cipher } from "crypto";

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
      ],[
        fixture.accounts[10].account.address,
        fixture.accounts[11].account.address,
        fixture.accounts[12].account.address,
        fixture.accounts[13].account.address,
        fixture.accounts[14].account.address,
      ], fixture.voteId, 3n, 10n, 9n],
      value: 1n
    })
    await fixture.publicClient.waitForTransactionReceipt({hash: initiatedRsp});
    const event = await fixture.avote.getEvents.ChangeStateLog();
    expect(event).to.have.lengthOf(1);
    expect(await fixture.avote.read.GetActivityInfo([fixture.voteId])).to.be.deep.equals(fixtureTest.InitiatedStateStart());
  })

  it("Should add the counter's public keys correctly", async function () {
    const fixture = await loadFixture(fixtureTest.deployFixture);
    await fixture.avote.write.SetTestState([fixture.voteId, fixtureTest.InitiatedStateStart()]);

    for (let i = 0; i < fixture.counterTestValues.length; i++) {
      const proof = await Prover.GenerateSubmitPublicKeyProof(fixture.curve, fixture.counterTestValues[i].private);
      let cli = await hre.viem.getContractAt("Avote", fixture.avote.address, {
        client: { wallet: fixture.accounts[i+1]},
      })
      const rsp = await cli.write.SubmitPublicKey([fixture.voteId, proof.proof, proof.publicKey]);
      await fixture.publicClient.waitForTransactionReceipt({hash: rsp});
      const voteEvents = await cli.getEvents.Action();
      expect(voteEvents).to.have.lengthOf(1);
    }
    expect(await fixture.avote.read.GetActivityInfo([fixture.voteId])).to.be.deep.equals(fixtureTest.InitiatedStateEnd());
  })

  it("Should change the state to voting successfully", async function () {
    const fixture = await loadFixture(fixtureTest.deployFixture);
    await fixture.avote.write.SetTestState([fixture.voteId, fixtureTest.InitiatedStateEnd()]);

    let counterPublicKeys: Util.BigPoint[] = [
      fixtureTest.InitiatedStateEnd().counters[0].publicKey,
      fixtureTest.InitiatedStateEnd().counters[1].publicKey,
      fixtureTest.InitiatedStateEnd().counters[2].publicKey,
    ]
    let proofs = await Prover.GenerateCheckSumProof(fixture.curve, counterPublicKeys);
    let p: Util.SumProof[] = [];
    for (let i = 0; i < proofs.length; i++) {
      p.push({
        proof: proofs[i].proof,
        sum: proofs[i].sum,
      });
    }
    let rsp = await fixture.avote.write.ChangeStateToVoting([fixture.voteId, p]);    

    await fixture.publicClient.waitForTransactionReceipt({hash: rsp});
    const event = await fixture.avote.getEvents.ChangeStateLog();
    expect(event).to.have.lengthOf(1);
    expect(await fixture.avote.read.GetActivityInfo([fixture.voteId])).to.be.deep.equals(fixtureTest.VotingStateStart());
  })

  it("Should submit the right votes", async () => {
    const curve = await buildBabyjub();
    const fixture = await loadFixture(fixtureTest.deployFixture);
    const state = fixtureTest.VotingStateStart();
    await fixture.avote.write.SetTestState([fixture.voteId, state]);
    for (let i = 0; i < fixture.voterPrivates.length; i++) {
      const proof = await Prover.GenerateVoteProof(curve, {
        publicKey: fixtureTest.VotingStateStart().sumPublicKey,
        value: fixture.voterPrivates[i].value,
        voterNum: BigInt(state.voters.length),
        candidateNum: BigInt(state.candidates.length),
        randomK: fixture.voterPrivates[i].randomK,
      });
      let wallet = fixture.accounts[i+10];
      let cli = await hre.viem.getContractAt("Avote", fixture.avote.address, {
        client: { wallet: wallet},
      })
      const rsp = await cli.write.Vote([fixture.voteId, proof.proof, proof.cipher]);
      await fixture.publicClient.waitForTransactionReceipt({hash: rsp});
      const voteEvents = await fixture.avote.getEvents.Action();
      expect(voteEvents).to.have.lengthOf(1);
    }
    expect(await fixture.avote.read.GetActivityInfo([fixture.voteId])).to.be.deep.equals(fixtureTest.VotingStateEnd());
  })

  it("Should change the state to tallying successfully", async function () {
    const fixture = await loadFixture(fixtureTest.deployFixture);
    await fixture.avote.write.SetTestState([fixture.voteId, fixtureTest.VotingStateEnd()]);

    let ballots: Util.BigCipher[] = [
      fixtureTest.VotingStateEnd().voters[0].ballot,
      fixtureTest.VotingStateEnd().voters[1].ballot,
      fixtureTest.VotingStateEnd().voters[2].ballot,
      fixtureTest.VotingStateEnd().voters[3].ballot,
      fixtureTest.VotingStateEnd().voters[4].ballot,
    ];
    let pointsC1: Util.BigPoint[] = [];
    let pointsC2: Util.BigPoint[] = [];
    for (let i = 0; i < ballots.length; i++) {
      pointsC1.push(ballots[i].c1);
      pointsC2.push(ballots[i].c2);
    }

    let proofsC1: Util.SumProof[] = [];
    let proofsC2: Util.SumProof[] = [];

    let proof1 = await Prover.GenerateCheckSumProof(fixture.curve, pointsC1);
    for (let j = 0; j < proof1.length; j++) {
      proofsC1.push({
        proof: proof1[j].proof,
        sum: proof1[j].sum,
      });
    }

    let proof2 = await Prover.GenerateCheckSumProof(fixture.curve, pointsC2);
    for (let j = 0; j < proof2.length; j++) {
      proofsC2.push({
        proof: proof2[j].proof,
        sum: proof2[j].sum,
      });
    }

    let rsp = await fixture.avote.write.ChangeStateToTallying([fixture.voteId, proofsC1, proofsC2]);    
    await fixture.publicClient.waitForTransactionReceipt({hash: rsp});
    const event = await fixture.avote.getEvents.ChangeStateLog();
    expect(event).to.have.lengthOf(1);
    expect(await fixture.avote.read.GetActivityInfo([fixture.voteId])).to.be.deep.equals(fixtureTest.TallyingStateStart());
  })

  it("Counter should decrypt the tally correctly", async ()=> {
    const fixture = await loadFixture(fixtureTest.deployFixture);
    await fixture.avote.write.SetTestState([fixture.voteId, fixtureTest.TallyingStateStart()]);
    for (let i = 0; i < fixture.counterTestValues.length; i++) {
      const proof = await Prover.GenerateDecryptProof(fixture.curve, fixture.counterTestValues[i].private, fixtureTest.TallyingStateStart().sumVotes.c1);
      let wallet = fixture.accounts[i+1];
      let cli = await hre.viem.getContractAt("Avote", fixture.avote.address, {
        client: { wallet: wallet},
      })
      const rsp = await cli.write.Decrypt([fixture.voteId, proof.proof, proof.decryption]);
      await fixture.publicClient.waitForTransactionReceipt({hash: rsp});
      const decryptEvents = await fixture.avote.getEvents.Action();
      expect(decryptEvents).to.have.lengthOf(1);
    }
    expect(await fixture.avote.read.GetActivityInfo([fixture.voteId])).to.deep.equals(fixtureTest.TallyingStateEnd());
  })

  it("Should change the state to published successfully", async function () {
    const fixture = await loadFixture(fixtureTest.deployFixture);
    let state = fixtureTest.TallyingStateEnd();
    await fixture.avote.write.SetTestState([fixture.voteId, state]);
    let points: Util.BigPoint[] = [state.sumVotes.c2];
    for (let i = 0; i < state.counters.length; i++) {
      points.push({
        x: -state.counters[i].decryption.x,
        y: state.counters[i].decryption.y,
      })
    }

    let proofs = await Prover.GenerateCheckSumProof(fixture.curve, points);
    let p: Util.SumProof[] = [];
    for (let i = 0; i < proofs.length; i++) {
      p.push({
        proof: proofs[i].proof,
        sum: proofs[i].sum,
      });
    }

    // console.log("proofs: ", proofs)

    // let scalar = 6**4*3 + 6**3 + 6**2;
    // console.log(scalar, Util.toBigPoint(fixture.curve,  fixture.curve.mulPointEscalar(fixture.curve.Base8, scalar)) );
    let result = Util.DecodePointToScalar(fixture.curve,
       Util.toPoint(fixture.curve, proofs[proofs.length-1].sum),
       BigInt(state.voters.length),
       BigInt(state.candidates.length),
    )
    let scalar = 0n;
    for (let i = 0; i < result.length; i++) {
      scalar += BigInt(state.voters.length+1)**BigInt(result.length-1-i)*result[i];
    }
    let proof = await (new Prover.ScalarMulG()).prove({scalar: BigInt(scalar)});
    let s: Util.PublishProof = {
      proof: {
          a: proof[0],
          b: proof[1],
          c: proof[2],
      },
      tally: result,
    }
    // console.log(proof[3])
    let rsp = await fixture.avote.write.ChangeStateToPublished([fixture.voteId, p, s]);    
    await fixture.publicClient.waitForTransactionReceipt({hash: rsp});
    const event = await fixture.avote.getEvents.ChangeStateLog();
    expect(event).to.have.lengthOf(1);
    expect(await fixture.avote.read.GetActivityInfo([fixture.voteId])).to.be.deep.equals(fixtureTest.PublishedState());
  })
});

