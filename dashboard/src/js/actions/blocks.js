// ----------------------------------------------------------------------------
// update a route block
// ----------------------------------------------------------------------------

export function changeMethod(block, method) {
  return {
    type: "BLOCK_CHANGE_METHOD",
    block: block.id,
    method,
  };
}

export function changeUrl(block, url) {
  return {
    type: "BLOCK_CHANGE_URL",
    block: block.id,
    url,
  };
}

export function changeHeaders(block, headers) {
  return {
    type: "BLOCK_CHANGE_HEADERS",
    block: block.id,
    headers,
  };
}

export function changeBody(block, body) {
  return {
    type: "BLOCK_CHANGE_BODY",
    block: block.id,
    body,
  };
}

export function changeTag(block, tag) {
  return {
    type: "BLOCK_CHANGE_TAG",
    block: block.id,
    tag,
  };
}
