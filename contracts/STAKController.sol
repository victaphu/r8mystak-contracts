// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import {Functions, FunctionsClient} from "./dev/functions/FunctionsClient.sol";
// import "@chainlink/contracts/src/v0.8/dev/functions/FunctionsClient.sol"; // Once published
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/ConfirmedOwner.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

interface IERC20Minter is IERC20 {
    function mint(address to, uint256 amount) external;
}

contract STAKController is FunctionsClient, ConfirmedOwner {
    using Functions for Functions.Request;

    // post id
    struct Post {
        address owner;
        uint256 totalLikes;
    }
    
    mapping(string => Post) public posts;
    mapping(bytes32 => string) public requestToPosts;

    event StaksRewarded(string indexed postId, uint256 rewardedTokens);
    event OCRResponse(bytes32 indexed requestId, bytes result, bytes err);

    IERC20Minter public staksToken;

    /**
     * @notice Executes once when a contract is created to initialize state variables
     *
     * @param oracle - The FunctionsOracle contract
     */
    // https://github.com/protofire/solhint/issues/242
    // solhint-disable-next-line no-empty-blocks
    constructor(address oracle, address staksAddress) FunctionsClient(oracle) ConfirmedOwner(msg.sender) {
        staksToken = IERC20Minter(staksAddress);
    }

    /**
   * @notice Send a simple request
   *
   * @param source JavaScript source code
   * @param secrets Encrypted secrets payload
   * @param args List of arguments accessible from within the source code
   * @param subscriptionId Funtions billing subscription ID
   * @param gasLimit Maximum amount of gas used to call the client contract's `handleOracleFulfillment` function
   * @return Functions request ID
   */
  function executeRequest(
    address postOwner,
    string calldata source,
    bytes calldata secrets,
    string[] calldata args,
    uint64 subscriptionId,
    uint32 gasLimit
  ) public onlyOwner returns (bytes32) {
    Functions.Request memory req;
    req.initializeRequest(Functions.Location.Inline, Functions.CodeLanguage.JavaScript, source);
    if (secrets.length > 0) {
      req.addRemoteSecrets(secrets);
    }
    if (args.length > 0) req.addArgs(args);

    bytes32 assignedReqID = sendRequest(req, subscriptionId, gasLimit);
    requestToPosts[assignedReqID] = args[0];
    if (posts[args[0]].owner == address(0)) {
        posts[args[0]].owner = postOwner;
    }
    return assignedReqID;
  }

 /**
   * @notice Callback that is invoked once the DON has resolved the request or hit an error
   *
   * @param requestId The request ID, returned by sendRequest()
   * @param response Aggregated response from the user code
   * @param err Aggregated error from the user code or from the execution pipeline
   * Either response or error parameter will be set, but never both
   */
  function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
    emit OCRResponse(requestId, response, err);

    require(bytes(requestToPosts[requestId]).length > 0, 'invalid request id');
    require(posts[requestToPosts[requestId]].owner != address(0), 'invalid post');

    uint256 currLikes = uint256(bytes32(response));
    uint256 likes = posts[requestToPosts[requestId]].totalLikes;

    if (currLikes > likes) {
        // mint tokens
        posts[requestToPosts[requestId]].totalLikes = currLikes;
        // mint difference as tokens
        staksToken.mint(posts[requestToPosts[requestId]].owner, (currLikes - likes) * 1 ether);
        emit StaksRewarded(requestToPosts[requestId], currLikes - likes);
    }   
    else {
        emit StaksRewarded(requestToPosts[requestId], 0);
    }
    // do nothing
    requestToPosts[requestId] = '';
  }
}
