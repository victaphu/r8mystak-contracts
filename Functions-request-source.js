console.log('Starting R8MyStak')
if (
  !secrets || 
  !secrets.apiKey ||
  secrets.apiKey == ""
) {
  throw Error(
    "API KEY NOT PROVIDED"
  )
}

if (!args[0] || args[0] === "") {
  throw Error("No post id provided")
}

const web2url = "https://i7iw4j2coi.execute-api.ap-southeast-2.amazonaws.com/staging/socials"
const lensurl = "https://api-mumbai.lens.dev/"

const graphql = `query Publication($request: PublicationQueryRequest!, $reactionRequest: ReactionFieldResolverRequest, $profileId: ProfileId) {\n  publication(request: $request) {\n    ... on Post {\n      ...PostFields\n      collectNftAddress\n      profile {\n        isFollowedByMe\n        __typename\n      }\n      referenceModule {\n        __typename\n      }\n      __typename\n    }\n    ... on Mirror {\n      ...MirrorFields\n      collectNftAddress\n      profile {\n        isFollowedByMe\n        __typename\n      }\n      referenceModule {\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment PostFields on Post {\n  id\n  reaction(request: $reactionRequest)\n  mirrors(by: $profileId)\n  hasCollectedByMe\n  onChainContentURI\n  isGated\n  isDataAvailability\n  dataAvailabilityProofs\n  canComment(profileId: $profileId) {\n    result\n    __typename\n  }\n  canMirror(profileId: $profileId) {\n    result\n    __typename\n  }\n  canDecrypt(profileId: $profileId) {\n    result\n    reasons\n    __typename\n  }\n  stats {\n    ...StatsFields\n    __typename\n  }\n  metadata {\n    ...MetadataFields\n    __typename\n  }\n  hidden\n  createdAt\n  appId\n  __typename\n}\n\nfragment StatsFields on PublicationStats {\n  totalUpvotes\n  totalAmountOfMirrors\n  totalAmountOfCollects\n  totalAmountOfComments\n  __typename\n}\n\nfragment MetadataFields on MetadataOutput {\n  name\n  content\n  image\n  attributes {\n    traitType\n    value\n    __typename\n  }\n  cover {\n    original {\n      url\n      __typename\n    }\n    __typename\n  }\n  media {\n    original {\n      url\n      mimeType\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment MirrorFields on Mirror {\n  id\n  reaction(request: $reactionRequest)\n  hasCollectedByMe\n  isGated\n  isDataAvailability\n  dataAvailabilityProofs\n  canComment(profileId: $profileId) {\n    result\n    __typename\n  }\n  canMirror(profileId: $profileId) {\n    result\n    __typename\n  }\n  canDecrypt(profileId: $profileId) {\n    result\n    reasons\n    __typename\n  }\n  stats {\n    ...StatsFields\n    __typename\n  }\n  metadata {\n    ...MetadataFields\n    __typename\n  }\n  hidden\n  mirrorOf {\n    ... on Post {\n      ...PostFields\n      __typename\n    }\n    __typename\n  }\n  createdAt\n  appId\n  __typename\n}\n`

// This example shows how to make a decentralized price feed using multiple APIs

// Arguments can be provided when a request is initated on-chain and used in the request source code as shown below
const postId = args[0]

const lensResult = await Functions.makeHttpRequest({
  url: lensurl,
  method: "POST",
  data: {
    operationName: "Publication",
    variables: {
      request: {
        publicationId: postId,
      },
      reactionRequest: null,
      profileId: null,
    },
    query:
      " query Publication($request: PublicationQueryRequest!, $reactionRequest: ReactionFieldResolverRequest, $profileId: ProfileId) {\n  publication(request: $request) {\n    ... on Post {\n      ...PostFields\n      collectNftAddress\n      profile {\n        isFollowedByMe\n        __typename\n      }\n      referenceModule {\n        __typename\n      }\n      __typename\n    }\n    ... on Mirror {\n      ...MirrorFields\n      collectNftAddress\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment PostFields on Post {\n  id\n  reaction(request: $reactionRequest)\n  mirrors(by: $profileId)\n  stats {\n    ...StatsFields\n    __typename\n  }\n  metadata {\n    ...MetadataFields\n    __typename\n  }\n  hidden\n  createdAt\n  appId\n  __typename\n}\n\nfragment StatsFields on PublicationStats {\n  totalUpvotes\n  totalAmountOfMirrors\n  totalAmountOfCollects\n  totalAmountOfComments\n  __typename\n}\n\nfragment MetadataFields on MetadataOutput {\n  name\n  content\n  image\n  attributes {\n    traitType\n    value\n    __typename\n  }\n  cover {\n    original {\n      url\n      __typename\n    }\n    __typename\n  }\n  media {\n    original {\n      url\n      mimeType\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment MirrorFields on Mirror {\n  id\n  reaction(request: $reactionRequest)\n  stats {\n    ...StatsFields\n    __typename\n  }\n  metadata {\n    ...MetadataFields\n    __typename\n  }\n  hidden\n  mirrorOf {\n    ... on Post {\n      ...PostFields\n      __typename\n    }\n    __typename\n  }\n  createdAt\n  appId\n  __typename\n}\n",
  },
})

// stats (likes)
// metadata (insta and tiktok)
const { publication } = lensResult.data.data

console.log(publication)

if (publication.metadata.content.indexOf("#r8mystak") < 0) {
  throw Error('Post not valid, does not contain r8mystak tag')
}

if (publication.metadata.content.indexOf("tiktok:") < 0 || publication.metadata.content.indexOf("instagram: ") < 0) {
  throw Error('Invalid post, doesnot have instagram or tiktok metadata');
}

const content = publication.metadata.content.split('\n').filter(e=>e.indexOf('tiktok') >= 0 || e.indexOf('instagram') >= 0);
console.log(content);

const insta = content.find(e=>e.indexOf('instagram: ') >= 0).replace('instagram: ', '')
const tiktok = content.find(e=>e.indexOf('tiktok: ') >= 0).replace('tiktok: ', '') 

console.log(insta, tiktok);

const instaTiktokResult = await Functions.makeHttpRequest({
  method: "POST",
  url: web2url,
  data: {
    postId: postId,
    tiktokId: tiktok,
    instaId: insta,
  },
  // Get a free API key from https://coinmarketcap.com/api/
  headers: { "x-api-key": secrets.apiKey },
})

const instaLikes = instaTiktokResult.data.data.instaLike;
const tiktokLikes = instaTiktokResult.data.data.tiktokLike;
const postLikes = publication.stats.totalUpvotes;
console.log(instaLikes, tiktokLikes, postLikes); 

return Functions.encodeUint256(instaLikes + tiktokLikes + postLikes);