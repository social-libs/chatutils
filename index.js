function createLib (execlib) {

  var lib = execlib.lib;

  function nr2personal (nrs, userid) {
    var i, nr;
    if (!lib.isArray(nrs)) {
      return null;
    }
    for (i=0; i<nrs.length; i++) {
      nr = nrs[i];
      if (nr.u === userid) {
        return nr.nr;
      }
    }
    return null;
  }

  function rcvdseen2personal (ntfobj, userid, rcvdorseen) {
    //console.log('gotta handle message', rcvdorseen+'by', ntfobj);
    var ret = lib.extend({}, ntfobj);
    selfsubstituter(ret, rcvdorseen+'by', userid, ret.p2p);
    //console.log('=>', ntfobj);
    return ret;
  }

  function notification2personal (ntfobj, userid) {
    var mymessage, myntfobj, mynr;
    if (!ntfobj) {
      return null;
    }
    if (ntfobj.rcvdby) {
      return rcvdseen2personal(ntfobj, userid, 'rcvd');
    }
    if (ntfobj.seenby) {
      return rcvdseen2personal(ntfobj, userid, 'seen');
    }
    //console.log('personalize chat ntf', ntfobj, 'with', userid);
    mymessage = msguserandmidder(
      !ntfobj.p2p,
      userid,
      ntfobj.mids[1],
      lib.extend({}, ntfobj.lastmessage)
    );
    myntfobj = lib.pickExcept(ntfobj, ['lastmessage', 'p2p', 'affected']);
    myntfobj.lastmessage = mymessage;
    mynr = nr2personal(ntfobj.nr, userid);
    //console.log('i, sta je mynr? od', ntfobj, 'za', userid, '=>', mynr);
    if (lib.isVal(mynr)) {
      myntfobj.nr = mynr;
    }
    return myntfobj;
  }

  function selfsubstituter (obj, propname, myuserid, isgroup) {
    if (obj[propname] === myuserid) {
      obj[propname] = null;
    } else if (!isgroup) {
      obj[propname] = '';
    }
  }

  function msguserandmidder (isgroup, myuserid, mid, msg) {
    selfsubstituter(msg, 'from', myuserid, isgroup);
    msg.id = mid;
    return msg;
  }

  return {
    nr2personal: nr2personal,
    notification2personal: notification2personal,
    msguserandmidder: msguserandmidder,
  };
}
module.exports = createLib;
